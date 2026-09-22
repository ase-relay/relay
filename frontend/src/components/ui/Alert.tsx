'use client';

import { ReactNode, useEffect, useState } from 'react';
import CloseIcon from '@/components/icons/common/CloseIcon';
import { StatusIcon, StatusType } from '@/components/icons/status/StatusIcon';

const alertStyles: Record<StatusType, string> = {
  success: 'border-[#00B14F] bg-[#E5F8EE]',
  error: 'border-red-500 bg-red-50',
  warning: 'border-amber-500 bg-amber-50',
  info: 'border-primary-600 bg-primary-50',
};

export interface AlertProps {
  /** Determines the icon and colour treatment of the alert. */
  status?: StatusType;
  /** Main message; set this per screen that renders the alert. */
  title: ReactNode;
  /** Supporting text; set this per screen that renders the alert. */
  description?: ReactNode;
  /** Called when the user closes the alert. Omit to hide the close button. */
  onClose?: () => void;
  /** Automatically dismisses the alert after the specified visible duration. */
  autoDismissMs?: number;
  className?: string;
}

export function Alert({
  status = 'success',
  title,
  description,
  onClose,
  autoDismissMs,
  className = '',
}: AlertProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!autoDismissMs || !onClose) return;

    const dismissTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, autoDismissMs);
    const removeTimer = window.setTimeout(onClose, autoDismissMs + 250);

    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, [autoDismissMs, onClose]);

  return (
    <div
      role="alert"
      className={`alert-toast flex items-start gap-3 rounded-xl border px-4 py-3 text-neutral-950 w-sm ${isLeaving ? 'alert-toast-exit' : ''} ${alertStyles[status]} ${className}`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <StatusIcon type={status} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-tight">{title}</p>
        {description && <div className="mt-1 text-sm leading-relaxed">{description}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="mt-1 shrink-0 cursor-pointer rounded-sm p-1 text-neutral-400 transition hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

export default Alert;
