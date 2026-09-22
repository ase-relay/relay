export default function InfoIcon({ color }: { color?: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill={color || "#004BDC"} />
            <path d="M12 16V11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="white" />
        </svg>
    )
}
