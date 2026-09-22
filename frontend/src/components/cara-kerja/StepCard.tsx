import type { ReactNode } from "react";

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  children?: ReactNode;
}

export function StepCard({ step, title, description, children }: StepCardProps) {
  return (
    <article className="w-full max-w-[550px] rounded-[20px] border border-neutral-200/80 bg-white px-5 pt-8 pb-9 shadow-[0_10px_30px_rgba(15,23,42,0.07)] sm:px-10">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
        {step}
      </span>
      <h2 className="mt-7 text-xl font-bold tracking-tight text-black sm:text-2xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-neutral-800 sm:text-base">
        {description}
      </p>
      {children && <div className="mt-7">{children}</div>}
    </article>
  );
}
