interface HalteIconProps {
    color?: string;
    className?: string;
}

export default function HalteIcon({ color = "white", className = "" }: HalteIconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M18 1.5V4.70001C18 4.86601 17.866 5 17.7 5H0.300049C0.134049 5 0 4.86601 0 4.70001V1.5C0 0.5 0.5 0 1.5 0H16.5C17.5 0 18 0.5 18 1.5ZM17 6.79999V15C17 17 16 18 14 18H4C2 18 1 17 1 15V6.79999C1 6.63399 1.13405 6.5 1.30005 6.5H16.7C16.866 6.5 17 6.63399 17 6.79999ZM11.75 9C11.75 8.59 11.41 8.25 11 8.25H7C6.59 8.25 6.25 8.59 6.25 9C6.25 9.41 6.59 9.75 7 9.75H11C11.41 9.75 11.75 9.41 11.75 9Z"
                fill={color}
            />
        </svg>
    );
}
