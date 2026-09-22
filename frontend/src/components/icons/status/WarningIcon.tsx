export default function WarningIcon({ color }: { color?: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill={color || "#F58220"} />
            <path d="M12 9V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="white" />
        </svg>
    )
}
