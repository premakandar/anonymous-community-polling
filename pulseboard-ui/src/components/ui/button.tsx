import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        accent: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)]',
        outline: 'border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface)]',
        ghost: 'text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
        danger: 'bg-[var(--danger)] text-white hover:bg-[#9f1239]',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'accent', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
