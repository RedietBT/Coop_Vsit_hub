import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { sanitizeInput, sanitizeIdentifier, sanitizeNumeric } from '@/core/utils/xssSanitizer';

export const Input = React.forwardRef(
  (
    {
      label,
      name,
      type = 'text',
      placeholder = '',
      error = null,
      helperText = null,
      icon: Icon = null,
      sanitize = 'text', // 'text' | 'identifier' | 'numeric' | false
      onChange,
      disabled = false,
      required = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const handleSanitizedChange = (e) => {
      let rawVal = e.target.value;

      // Apply live sanitization
      if (sanitize === 'identifier') {
        rawVal = sanitizeIdentifier(rawVal);
      } else if (sanitize === 'numeric') {
        rawVal = sanitizeNumeric(rawVal);
      } else if (sanitize === 'text') {
        rawVal = sanitizeInput(rawVal);
      }

      e.target.value = rawVal;

      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {/* Label */}
        {label && (
          <label
            htmlFor={name}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative rounded-xl shadow-xs transition-all duration-200">
          {/* Leading Icon */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={computedType}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleSanitizedChange}
            className={`w-full text-sm rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${
              Icon ? 'pl-10' : 'pl-3.5'
            } ${isPasswordType ? 'pr-11' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-coop-gold focus:ring-coop-gold/25'
            } ${className}`}
            {...props}
          />

          {/* Password Reveal Toggle */}
          {isPasswordType && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-coop-navy transition-colors focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1 text-xs text-rose-600 font-medium animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
