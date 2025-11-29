import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
    {
        variants: {
            variant: {
                primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary shadow-sm hover:shadow-md',
                secondary: 'bg-white dark:bg-gray-800 text-brand-primary dark:text-brand-primary border-2 border-brand-primary hover:bg-brand-primary-soft dark:hover:bg-gray-700 focus-visible:ring-brand-primary',
                success: 'bg-brand-ai text-white hover:bg-brand-ai-strong focus-visible:ring-brand-ai shadow-sm hover:shadow-md',
                danger: 'bg-error text-white hover:bg-error/90 focus-visible:ring-error shadow-sm hover:shadow-md',
                warning: 'bg-warning text-white hover:bg-warning/90 focus-visible:ring-warning shadow-sm hover:shadow-md',
                info: 'bg-info text-white hover:bg-info/90 focus-visible:ring-info shadow-sm hover:shadow-md',
                ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400',
                outline: 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-gray-400',
                link: 'text-brand-primary hover:underline focus-visible:ring-brand-primary p-0 shadow-none hover:shadow-none',
            },
            size: {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2.5 text-sm',
                lg: 'px-6 py-3 text-base',
                xl: 'px-8 py-4 text-lg',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    loading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, loading, loadingText, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
        return (
            <button
                className={buttonVariants({ variant, size, fullWidth, className })}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {leftIcon && !loading && <span className="flex-shrink-0">{leftIcon}</span>}
                {loading && (
                    <svg
                        className="animate-spin h-4 w-4 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                <span>{loading && loadingText ? loadingText : children}</span>
                {rightIcon && !loading && <span className="flex-shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
