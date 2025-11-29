import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        {label}
                        {props.required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full px-4 py-3
            border-2 ${error ? 'border-error' : 'border-gray-200 dark:border-gray-700'}
            rounded-lg
            text-gray-900 dark:text-gray-100
            bg-white dark:bg-gray-800
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-all duration-200
            focus:border-brand-primary
            focus:ring-4 focus:ring-brand-primary/10
            focus:outline-none
            hover:border-gray-300 dark:hover:border-gray-600
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, helperText, id, rows = 4, ...props }, ref) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        {label}
                        {props.required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    rows={rows}
                    className={`
            w-full px-4 py-3
            border-2 ${error ? 'border-error' : 'border-gray-200 dark:border-gray-700'}
            rounded-lg
            text-gray-900 dark:text-gray-100
            bg-white dark:bg-gray-800
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-all duration-200
            focus:border-brand-primary
            focus:ring-4 focus:ring-brand-primary/10
            focus:outline-none
            hover:border-gray-300 dark:hover:border-gray-600
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            resize-vertical
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
