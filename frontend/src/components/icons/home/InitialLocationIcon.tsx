interface IconProps {
    className?: string;
}

export default function InitialLocationIcon({ className = '' }: IconProps) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="11" stroke="#004BDC" stroke-width="2" />
            <circle cx="12" cy="12" r="7" fill="#004BDC" />
        </svg>
    )
}
