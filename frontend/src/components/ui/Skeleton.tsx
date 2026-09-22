import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use `circle` for avatars and `text` for a compact text line. */
  variant?: 'rectangle' | 'rounded' | 'circle' | 'text';
}

const variantClass: Record<NonNullable<SkeletonProps['variant']>, string> = {
  rectangle: 'rounded-none',
  rounded: 'rounded-xl',
  circle: 'aspect-square rounded-full',
  text: 'h-4 rounded-md',
};

export function Skeleton({ variant = 'rounded', className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer bg-neutral-200 ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
