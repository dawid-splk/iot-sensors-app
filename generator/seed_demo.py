#!/usr/bin/env python3
"""Seeds demo data through the public API (admin login, series, sensors, historical measurements).

Environment:
  ZAI_API_URL     API address (or --api-url), e.g. http://localhost:8080
  ADMIN_USERNAME  admin login
  ADMIN_PASSWORD  admin password

Series that already exist (same name) are skipped entirely. Sensor API keys of newly created
sensors are saved to generator/.keys.json (not commited), because the API shows a key only once.
"""
import argparse
import json
import os
import requests
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from generator import TIMEOUT_SECONDS, generate_value, send_measurement

KEYS_FILE = Path(__file__).resolve().parent / ".keys.json"
POINTS = 48
STEP = timedelta(minutes=30)
PERIOD = timedelta(hours=24)

DEMO_SERIES = [
    {"name": "Temperatura – salon", "minValue": -10, "maxValue": 40, "color": "#1f77b4",
     "icon": "circle", "unit": "°C", "mode": "sine", "from": 19.0, "to": 23.0},
    {"name": "Wilgotność – salon", "minValue": 0, "maxValue": 100, "color": "#2ca02c",
     "icon": "triangle", "unit": "%", "mode": "sine", "from": 40.0, "to": 65.0},
    {"name": "Temperatura – zewnątrz", "minValue": -40, "maxValue": 50, "color": "#d62728",
     "icon": "rect", "unit": "°C", "mode": "sine", "from": 5.0, "to": 14.0},
]


def fail(message: str) -> None:
    print(f"✗ {message}")
    sys.exit(1)


def api(method: str, url: str, token: str | None = None, **kwargs) -> requests.Response:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        return requests.request(method, url, headers=headers, timeout=TIMEOUT_SECONDS, **kwargs)
    except requests.RequestException as e:
        fail(f"Błąd połączenia z API ({e.__class__.__name__})")


def login(api_url: str, username: str, password: str) -> str:
    response = api("POST", f"{api_url}/api/auth/login", json={"username": username, "password": password})
    if response.status_code != 200:
        fail(f"Logowanie nie powiodło się ({response.status_code})")
    return response.json()["accessToken"]


def load_keys() -> dict:
    if KEYS_FILE.exists():
        return json.loads(KEYS_FILE.read_text(encoding="utf-8"))
    return {}


def save_keys(keys: dict) -> None:
    KEYS_FILE.write_text(json.dumps(keys, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Dane przykładowe przez API")
    parser.add_argument("--api-url", default=os.environ.get("ZAI_API_URL"))
    args = parser.parse_args()
    if not args.api_url:
        parser.error("podaj --api-url albo ustaw ZAI_API_URL")
    api_url = args.api_url.rstrip("/")
    username, password = os.environ.get("ADMIN_USERNAME"), os.environ.get("ADMIN_PASSWORD")
    if not username or not password:
        parser.error("ustaw zmienne ADMIN_USERNAME i ADMIN_PASSWORD")

    token = login(api_url, username, password)
    existing = api("GET", f"{api_url}/api/series").json()
    existing_names = {s["name"] for s in existing}
    keys = load_keys()
    now = datetime.now(timezone.utc)

    for demo in DEMO_SERIES:
        name = demo["name"]
        if name in existing_names:
            print(f"- Pomijam „{name}”: seria już istnieje")
            continue

        series_body = {k: demo[k] for k in ("name", "minValue", "maxValue", "color", "icon", "unit")}
        created = api("POST", f"{api_url}/api/series", token, json=series_body)
        if created.status_code != 201:
            fail(f"Nie udało się utworzyć serii „{name}” ({created.status_code})")
        series = created.json()

        sensor_resp = api("POST", f"{api_url}/api/sensors", token,
                          json={"name": f"Czujnik – {name}", "seriesId": series["id"]})
        if sensor_resp.status_code != 201:
            fail(f"Nie udało się zarejestrować czujnika dla „{name}” ({sensor_resp.status_code})")
        sensor = sensor_resp.json()
        keys[name] = {"seriesId": series["id"], "sensorId": sensor["id"], "apiKey": sensor["apiKey"]}
        save_keys(keys)  # saved right away: the key cannot be retrieved later

        accepted = 0
        for i in range(POINTS):
            ts = now - STEP * (POINTS - 1 - i)
            value = generate_value(demo["mode"], ts, demo["from"], demo["to"], PERIOD)
            result = send_measurement(api_url, sensor["apiKey"], value, ts)
            if not result.ok:
                print(result.message)
            accepted += result.ok
        print(f"✓ „{name}”: seria id={series['id']}, czujnik id={sensor['id']}, wyników {accepted}/{POINTS}")

    print(f"Klucze nowych czujników: {KEYS_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
