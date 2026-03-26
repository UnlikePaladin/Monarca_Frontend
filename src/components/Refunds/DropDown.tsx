/**
 * DropDown.tsx
 * 
 * Reusable dropdown select component with validation and error handling.
 */

import React, { ChangeEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  id?: string;
  name?: string;
  value: string;
  options: Option[];
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

/**
 * Renders a dropdown select with labels, validation, and error messages.
 * @param id - HTML id attribute
 * @param name - Name attribute for the select element
 * @param value - Currently selected value
 * @param options - Array of selectable options
 * @param placeholder - Placeholder text
 * @param className - Custom CSS classes for the select
 * @param wrapperClassName - Custom CSS classes for the wrapper
 * @param disabled - Whether the dropdown is disabled
 * @param required - Whether the field is required
 * @param label - Label text for the dropdown
 * @param error - Error message to display
 * @param onChange - Change event handler
 * @param onBlur - Blur event handler
 * @param onFocus - Focus event handler
 * @returns Dropdown select component
 */
 interface DropdownProps {
   id?: string;
   name?: string;
   value: string;
   options: Option[];
   placeholder?: string;
   className?: string;
   wrapperClassName?: string;
   disabled?: boolean;
   required?: boolean;
   label?: string;
   error?: string;
   onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
   onBlur?: () => void;
   onFocus?: () => void;
 }
 
const Dropdown: React.FC<DropdownProps> = ({
  id,
  name,
  value,
  options,
  placeholder = "Select an option",
  className = "p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 text-[#0a2c6d] focus:ring-blue-500 bg-white hover:cursor-pointer",
  wrapperClassName = "relative flex flex-col mb-4",
  disabled = false,
  required = false,
  label,
  error,
  onChange,
  onBlur,
  onFocus,
}) => {
  return (
    <div className={wrapperClassName}>
       {label && (
         <label htmlFor={id || name} className="mb-1 text-sm font-medium text-[#0a2c6d]">
           {label}
           {required && <span className="text-red-500 ml-1">*</span>}
         </label>
       )}
       <div className="relative">
         <select

         
           id={id || name}
           name={name}
           value={value}
           className={className}
           disabled={disabled}
           required={required}
           onChange={onChange}
           onBlur={onBlur}
           onFocus={onFocus}
         >
           {placeholder && (
             <option value="" disabled>
               {placeholder}
             </option>
           )}
           {options.map((option) => (
             <option key={option.value} value={option.value}>
               {option.label}
             </option>
           ))}
         </select>
       </div>
       {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
     </div>
   );
 };
 
 export default Dropdown;

/*
Modification History:

- 2025-04-20 | José Manuel García Zumaya | Initial creation.
- 2026-02-26 | Santiago Arista | Added complete JSDoc documentation and modification history.
*/