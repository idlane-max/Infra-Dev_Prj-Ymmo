import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    
    return (
      <div className={`w-full ${className}`}>
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 text-slate-900'}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
