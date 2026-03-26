/**
 * Input.tsx
 * 
 * Reusable text input component with consistent styling.
 * Extends native HTML input with custom design system.
 */

import React from "react";
import clsx from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

/**
 * Renders a styled text input field.
 * @param className - Additional CSS classes for customization
 * @param props - Native input HTML attributes
 * @param ref - Forwarded ref to the input element
 * @returns Styled input component
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const baseStyles =
      "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5";
    return (
      <input ref={ref} className={clsx(baseStyles, className)} {...props} />
    );
  }
);
Input.displayName = "Input";

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
