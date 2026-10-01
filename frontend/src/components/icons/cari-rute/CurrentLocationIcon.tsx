interface IconProps {
    className?: string;
    size?: number;
    backgroundColor?: string;
    strokeColor?: string;
    fillColor?: string;
}

export default function CurrentLocationIcon({
    className = '',
    size = 60,
    backgroundColor = '#004BDC',
    strokeColor = '#004BDC',
    fillColor = '#004BDC',
}: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
            <rect width="60" height="60" rx="30" fill={backgroundColor} fillOpacity="0.1" />
            <circle cx="30" cy="30" r="11" stroke={strokeColor} strokeWidth="2" />
            <circle cx="30" cy="30" r="7" fill={fillColor} />
        </svg>
    )
}
