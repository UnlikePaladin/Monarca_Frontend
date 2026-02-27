/**
 * TextArea.tsx
 * 
 * Reusable textarea component with consistent styling.
 * Extends native HTML textarea with custom design system.
 */

import React from "react";
import clsx from "clsx";

export type TextAreaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
  };

/**
 * Renders a styled textarea field for multi-line text input.
 * @param className - Additional CSS classes for customization
 * @param props - Native textarea HTML attributes
 * @param ref - Forwarded ref to the textarea element
 * @returns Styled textarea component
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    const baseStyles =
      "block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-600 focus:border-primary-600";
    return (
      <textarea ref={ref} className={clsx(baseStyles, className)} {...props} />
    );
  }
);
TextArea.displayName = "TextArea";

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and displayName.
*/
