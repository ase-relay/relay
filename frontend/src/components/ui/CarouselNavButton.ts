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
    const sizeClass = size === "sm" ? "h-11 w-11 [&>svg]:h-6 [&>svg]:w-6" : "h-14 w-14 [&>svg]:h-8 [&>svg]:w-8";

    return createElement(
        "button",
        {
            type: "button",
            "aria-label": isPrevious ? "Slide sebelumnya" : "Slide berikutnya",
            className: `group flex cursor-pointer ${sizeClass} items-center justify-center rounded-full bg-neutral-400 text-black shadow-[0_4px_12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:scale-105 hover:bg-primary-600 hover:text-white hover:shadow-[0_0_0_18px_rgba(255,255,255,0.92),0_8px_18px_rgba(15,23,42,0.16)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 ${className}`,
            ...buttonProps,
        },
        createElement(Icon, { className: "stroke-[3]" }),
    );
}
