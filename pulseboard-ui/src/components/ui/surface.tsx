import { cn } from '../../lib/utils';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'bg-[var(--surface)] text-[var(--ink-muted)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent-deep)]',
    ok: 'bg-[var(--ok-soft)] text-[var(--ok)]',
    warn: 'bg-[var(--warn-soft)] text-[var(--warn)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius)] px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[120px] w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}
