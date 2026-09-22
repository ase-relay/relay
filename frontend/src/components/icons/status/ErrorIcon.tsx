export default function ErrorIcon({ color }: { color?: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill={color || "#FF0000"} />
            <path d="M15 9.00002L9 15M8.99997 9L14.9999 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}
