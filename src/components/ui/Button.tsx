/**
 * Button.tsx
 * 
 * Reusable button component with consistent styling.
 * Extends native HTML button with custom design system colors.
 */

import React from "react";
import clsx from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

/**
 * Renders a styled button with primary color scheme.
 * @param children - Button content (text, icons, etc.)
 * @param className - Additional CSS classes for customization
 * @param props - Native button HTML attributes
 * @returns Styled button component
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  ...props
}) => {
  const baseStyles =
    "px-5 py-2.5 text-sm font-medium text-white bg-[var(--blue)] rounded-lg focus:ring-4 focus:ring-primary-200 hover:[var(--dark-blue)] cursor-pointer block";
  return (
    <button className={clsx(baseStyles, className)} {...props}>
      {children}
    </button>
  );
};

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
