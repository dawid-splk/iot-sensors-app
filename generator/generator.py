#!/usr/bin/env python3
"""Measurement generator for the ZAI API.

Sends measurements to POST /api/measurements using a sensor API key.

Examples:
  python generator.py --api-url URL --api-key KEY backfill --count 48 --step 30m --mode sine --min 18 --max 24
  python generator.py --api-url URL --api-key KEY live --interval 10 --mode random --min 18 --max 24
  python generator.py --api-url URL --api-key KEY once --value 999
  python generator.py --api-url URL --api-key KEY live --interval 300 --mode openmeteo --lat 50.06 --lon 19.94
"""
import argparse
import math
import os
import random
import re
import requests
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

TIMEOUT_SECONDS = 15
# October temperatures
DEFAULT_MIN = 0.0
DEFAULT_MAX = 15.0
MODES = ("random", "sine", "range", "openmeteo")
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


@dataclass
class Result:
    ok: bool
    status: int | None
    message: str
    unauthorized: bool = False


def parse_duration(text: str) -> timedelta:
    """Parses values like 30s, 10m, 2h, 1d."""
    match = re.fullmatch(r"(\d+)\s*([smhd])", text.strip().lower())
    if not match:
        raise argparse.ArgumentTypeError(f"Niepoprawny czas '{text}' (przykłady: 30s, 30m, 2h, 1d)")
    amount, unit = int(match.group(1)), match.group(2)
    if amount <= 0:
        raise argparse.ArgumentTypeError("Czas musi być dodatni")
    return timedelta(**{{"s": "seconds", "m": "minutes", "h": "hours", "d": "days"}[unit]: amount})


def parse_timestamp(text: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"Niepoprawny znacznik czasu '{text}' (ISO 8601)") from e
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def iso(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def generate_value(mode: str, ts: datetime, lo: float, hi: float, period: timedelta) -> float:
    """Value for mode random/sine/range. sine and range depend on the timestamp, so backfill is smooth.

    sine  - sinusoid between lo and hi with the given period
    range - triangle wave: lo -> hi -> lo with the given period
    random - uniform random value in [lo, hi]
    """
    if mode == "random":
        value = random.uniform(lo, hi)
    else:
        phase = (ts.timestamp() % period.total_seconds()) / period.total_seconds()
        if mode == "sine":
            value = (lo + hi) / 2 + (hi - lo) / 2 * math.sin(2 * math.pi * phase)
        elif mode == "range":
            value = lo + (hi - lo) * (1 - abs(2 * phase - 1))
        else:
            raise ValueError(f"Tryb '{mode}' nie generuje wartości lokalnie")
    return round(min(max(value, lo), hi), 1)


def fetch_open_meteo(lat: float, lon: float, variable: str) -> float:
    try:
        response = requests.get(
            OPEN_METEO_URL,
            params={"latitude": lat, "longitude": lon, "current": variable},
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return float(response.json()["current"][variable])
    except (requests.RequestException, KeyError, ValueError, TypeError) as e:
        raise RuntimeError(f"Nie udało się pobrać danych z Open-Meteo ({e.__class__.__name__})") from e


def problem_text(response: requests.Response) -> str:
    try:
        body = response.json()
        return body.get("detail") or body.get("title") or response.reason
    except ValueError:
        return response.reason or "brak szczegółów"


def send_measurement(api_url: str, api_key: str, value: float, timestamp: datetime | None = None) -> Result:
    body: dict = {"value": value}
    if timestamp is not None:
        body["timestamp"] = iso(timestamp)
    try:
        response = requests.post(
            f"{api_url}/api/measurements",
            json=body,
            headers={"X-API-Key": api_key},
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as e:
        return Result(False, None, f"✗ Błąd połączenia z API ({e.__class__.__name__})")

    if response.status_code == 201:
        data = response.json()
        return Result(True, 201, f"✓ 201 id={data['id']} value={data['value']} ts={data['timestamp']}")
    if response.status_code == 401:
        return Result(False, 401, "✗ Klucz nieprawidłowy lub czujnik wyrejestrowany", unauthorized=True)
    if response.status_code == 422:
        return Result(False, 422, f"✗ ODRZUCONO (422): {problem_text(response)}")
    return Result(False, response.status_code, f"✗ Błąd {response.status_code}: {problem_text(response)}")


def cmd_backfill(args) -> int:
    now = datetime.now(timezone.utc)
    accepted = failed = 0
    for i in range(args.count):
        ts = now - args.step * (args.count - 1 - i)
        value = generate_value(args.mode, ts, args.min, args.max, args.period)
        result = send_measurement(args.api_url, args.api_key, value, ts)
        print(result.message)
        if result.unauthorized:
            return 1
        accepted, failed = accepted + result.ok, failed + (not result.ok)
    print(f"Gotowe: przyjęto {accepted}, odrzucono lub błędów {failed}")
    return 0 if failed == 0 else 1


def cmd_live(args) -> int:
    sent = 0
    try:
        while args.count is None or sent < args.count:
            now = datetime.now(timezone.utc)
            try:
                if args.mode == "openmeteo":
                    value = fetch_open_meteo(args.lat, args.lon, args.variable)
                else:
                    value = generate_value(args.mode, now, args.min, args.max, args.period)
            except RuntimeError as e:
                print(f"✗ {e}")
            else:
                result = send_measurement(args.api_url, args.api_key, value)
                print(result.message)
                if result.unauthorized:
                    return 1
            sent += 1
            if args.count is None or sent < args.count:
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nPrzerwano (Ctrl+C)")
    return 0


def cmd_once(args) -> int:
    result = send_measurement(args.api_url, args.api_key, args.value, args.timestamp)
    print(result.message)
    return 0 if result.ok else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generator wyników dla API „Serie pomiarowe”")
    parser.add_argument("--api-url", default=os.environ.get("ZAI_API_URL"),
                        help="adres API (lub zmienna ZAI_API_URL)")
    parser.add_argument("--api-key", default=os.environ.get("ZAI_API_KEY"),
                        help="klucz API czujnika (lub zmienna ZAI_API_KEY)")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_value_options(p: argparse.ArgumentParser, modes: tuple[str, ...]) -> None:
        p.add_argument("--mode", choices=modes, default="random", help="tryb wartości (domyślnie random)")
        p.add_argument("--min", type=float, default=DEFAULT_MIN, help=f"dolna granica (domyślnie {DEFAULT_MIN})")
        p.add_argument("--max", type=float, default=DEFAULT_MAX, help=f"górna granica (domyślnie {DEFAULT_MAX})")
        p.add_argument("--period", type=parse_duration, default=parse_duration("24h"),
                       help="okres dla trybów sine i range (domyślnie 24h)")

    backfill = sub.add_parser("backfill", help="wyniki z przeszłości, kończące się teraz")
    backfill.add_argument("--count", type=int, default=48, help="liczba punktów (domyślnie 48)")
    backfill.add_argument("--step", type=parse_duration, default=parse_duration("30m"),
                          help="odstęp między punktami, np. 30m (domyślnie 30m)")
    add_value_options(backfill, ("random", "sine", "range"))
    backfill.set_defaults(func=cmd_backfill)

    live = sub.add_parser("live", help="bieżące wyniki w stałych odstępach (Ctrl+C kończy)")
    live.add_argument("--interval", type=float, default=10, help="odstęp w sekundach (domyślnie 10)")
    live.add_argument("--count", type=int, default=None, help="liczba wyników (domyślnie bez końca)")
    add_value_options(live, MODES)
    live.add_argument("--lat", type=float, default=50.06, help="szerokość geograficzna (openmeteo)")
    live.add_argument("--lon", type=float, default=19.94, help="długość geograficzna (openmeteo)")
    live.add_argument("--variable", default="temperature_2m", help="zmienna Open-Meteo (domyślnie temperature_2m)")
    live.set_defaults(func=cmd_live)

    once = sub.add_parser("once", help="pojedynczy wynik")
    once.add_argument("--value", type=float, required=True)
    once.add_argument("--timestamp", type=parse_timestamp, default=None,
                      help="znacznik czasu ISO 8601 (domyślnie czas serwera)")
    once.set_defaults(func=cmd_once)
    return parser


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = build_parser()
    args = parser.parse_args()

    if not args.api_url:
        parser.error("podaj --api-url albo ustaw ZAI_API_URL")
    if not args.api_key:
        parser.error("podaj --api-key albo ustaw ZAI_API_KEY")
    args.api_url = args.api_url.rstrip("/")

    if args.command in ("backfill", "live") and args.mode != "openmeteo" and args.min >= args.max:
        parser.error("--min musi być mniejsze niż --max")
    if args.command == "backfill" and args.count < 1:
        parser.error("--count musi wynosić co najmniej 1")
    if args.command == "live" and args.interval <= 0:
        parser.error("--interval musi być dodatnie")
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
