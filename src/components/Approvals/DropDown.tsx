/**
 * DropDown.tsx
 * 
 * Custom dropdown select component for approvals.
 * Provides a clickable dropdown menu with options and automatic closing on outside click.
 */

import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Renders a custom dropdown select component.
 * @param options - Array of selectable options
 * @param value - Currently selected value
 * @param onChange - Callback when selection changes
 * @param placeholder - Placeholder text when no option selected
 * @returns Custom dropdown component
 */
const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative inline-block w-48" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring"
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className="float-right">&#x25BC;</span> {/* Arrow ▼ */}
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow max-h-60 overflow-auto">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`cursor-pointer px-4 py-2 hover:bg-blue-600 hover:text-white ${
                opt.value === value ? "bg-blue-500 text-white" : ""
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated text to English.
*/
