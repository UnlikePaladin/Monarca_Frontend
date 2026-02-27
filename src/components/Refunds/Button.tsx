/**
 * Button.tsx
 * 
 * Reusable button component with customizable styling and behavior.
 */

import React from "react";

interface ButtonProps {
  id?: string;
  label: string;
  className?: string;
  disabled?: boolean;
  onClickFunction?: () => void;
}

/**
 * Renders a customizable button with optional styling and click handler.
 * @param id - Optional HTML id attribute
 * @param label - Button text label
 * @param className - Custom CSS classes for styling
 * @param disabled - Whether the button is disabled
 * @param onClickFunction - Click event handler function
 * @returns Button component
 */
const Button: React.FC<ButtonProps> = ({
  id,
  label,
  className = "bg-white hover:bg-gray-300 hover:cursor-pointer p-2 text-[#0a2c6d] font-bold rounded-md shadow-md",
  disabled = false,
  onClickFunction,
}) => {
  return (
    <button className={className} disabled={disabled} onClick={onClickFunction} id={id}>
      {label}
    </button>
  );
};

export default Button;

/*
Modification History:

- 2025-04-20 | José Manuel García Zumaya | Initial creation.
- 2026-02-26 | Santiago Arista | Added complete JSDoc documentation and modification history.
*/
