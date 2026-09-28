interface LogoutIconProps {
    color?: string;
    className?: string;
}

export default function LogoutIcon({ color = "white", className = "" }: LogoutIconProps) {
    return (
        <svg
            width="25"
            height="22"
            viewBox="0 0 25 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M14.75 6V3.5C14.75 2.83696 14.4866 2.20107 14.0178 1.73223C13.5489 1.26339 12.913 1 12.25 1H3.5C2.83696 1 2.20107 1.26339 1.73223 1.73223C1.26339 2.20107 1 2.83696 1 3.5V18.5C1 19.163 1.26339 19.7989 1.73223 20.2678C2.20107 20.7366 2.83696 21 3.5 21H12.25C12.913 21 13.5489 20.7366 14.0178 20.2678C14.4866 19.7989 14.75 19.163 14.75 18.5V16"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.5 11H23.5M19.75 14.75L23.5 11L19.75 7.25"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
