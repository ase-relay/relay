import { createElement, type ButtonHTMLAttributes } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

type CarouselNavButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    direction: "previous" | "next";
    size?: "sm" | "md";
};

export function CarouselNavButton({
    direction,
    size = "md",
    className = "",
    ...buttonProps
}: CarouselNavButtonProps) {
    const isPrevious = direction === "previous";
    const Icon = isPrevious ? HiChevronLeft : HiChevronRight;
    // sm = tombol pada desain (58px, membesar ke 65px saat hover lewat scale 1.12).
    const sizeClass = size === "sm" ? "h-[58px] w-[58px] [&>svg]:h-8 [&>svg]:w-8" : "h-14 w-14 [&>svg]:h-8 [&>svg]:w-8";

    return createElement(
        "button",
        {
            type: "button",
            "aria-label": isPrevious ? "Slide sebelumnya" : "Slide berikutnya",
            className: `group flex cursor-pointer ${sizeClass} items-center justify-center rounded-full bg-[#8e8e93] text-white shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all duration-200 hover:scale-[1.12] hover:bg-primary-600 hover:shadow-[0_0_16px_8px_rgba(255,255,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 ${className}`,
            ...buttonProps,
        },
        createElement(Icon, { className: "stroke-[3]" }),
    );
}