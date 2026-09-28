interface DashboardIconProps {
    color?: string;
    className?: string;
}

export default function DashboardIcon({ color = "#004BDC", className = "" }: DashboardIconProps) {
    return (
        <svg
            width="23"
            height="24"
            viewBox="0 0 23 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M12.7778 8V0H23V8H12.7778ZM0 13.3333V0H10.2222V13.3333H0ZM12.7778 24V10.6667H23V24H12.7778ZM0 24V16H10.2222V24H0Z"
                fill={color}
            />
        </svg>
    );
}
