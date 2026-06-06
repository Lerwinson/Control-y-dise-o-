'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-br from-blood to-darkblood text-white shadow-[0_0_16px_rgba(255,0,0,0.5)] hover:shadow-[0_0_26px_rgba(255,0,0,0.8)] hover:-translate-y-px',
        ghost: 'bg-red-600/10 border border-red-500/30 text-red-100 hover:bg-red-600/20',
        tool: 'bg-black/50 border border-red-500/20 text-orange-200 hover:bg-red-600/20 hover:text-white data-[active=true]:bg-red-600/30 data-[active=true]:text-white data-[active=true]:shadow-[0_0_12px_rgba(255,0,0,0.5)]',
      },
      size: { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-5 py-3', icon: 'p-2' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
export { buttonVariants };
