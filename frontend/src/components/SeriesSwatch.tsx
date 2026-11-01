import type {SeriesIcon} from '@/lib/series-style'
import {cn} from '@/lib/utils'

interface SeriesSwatchProps {
    color: string
    pointStyle: SeriesIcon
    borderDash: readonly number[]
    className?: string
}

function Marker({pointStyle, color}: { pointStyle: SeriesIcon; color: string }) {
    switch (pointStyle) {
        case 'triangle':
            return <polygon points="14,2 18.5,10.5 9.5,10.5" fill={color}/>
        case 'rect':
            return <rect x="10" y="3" width="8" height="8" fill={color}/>
        case 'rectRot':
            return <polygon points="14,2 19,7 14,12 9,7" fill={color}/>
        case 'cross':
            return <path d="M14 2V12M9 7H19" stroke={color} strokeWidth="2" fill="none"/>
        case 'crossRot':
            return <path d="M10.5 3.5L17.5 10.5M17.5 3.5L10.5 10.5" stroke={color} strokeWidth="2" fill="none"/>
        case 'star':
            return (
                <polygon
                    points="14,2 15.41,5.56 19.23,5.8 16.28,8.24 17.23,11.95 14,9.9 10.77,11.95 11.72,8.24 8.77,5.8 12.59,5.56"
                    fill={color}
                />
            )
        default:
            return <circle cx="14" cy="7" r="4" fill={color}/>
    }
}

// Decorative: the series name always sits next to it, so it is hidden from assistive technology.
export function SeriesSwatch({color, pointStyle, borderDash, className}: SeriesSwatchProps) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 28 14"
            className={cn('h-3.5 w-7 shrink-0', className)}
        >
            <line
                x1="0"
                y1="7"
                x2="28"
                y2="7"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={borderDash.length > 0 ? borderDash.join(' ') : undefined}
            />
            <Marker pointStyle={pointStyle} color={color}/>
        </svg>
    )
}
