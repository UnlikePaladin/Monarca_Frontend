/**
 * Switch.tsx
 * 
 * Toggle switch component built with Headless UI.
 * Provides an accessible on/off toggle control.
 */

import { Switch as HSwitch } from "@headlessui/react";
import clsx from "clsx";

export interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  srLabel?: string;
  id?: string;
}

/**
 * Renders an accessible toggle switch.
 * @param checked - Current checked state
 * @param onChange - Callback function when toggle state changes
 * @param disabled - Whether the switch is disabled
 * @param className - Additional CSS classes
 * @param srLabel - Screen reader label
 * @param id - HTML id attribute
 * @returns Toggle switch component
 */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  className,
  srLabel = "toggle",
  id,
}: SwitchProps) {
  return (
    <HSwitch
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        checked ? "bg-indigo-600" : "bg-gray-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="sr-only">{srLabel}</span>
      <span
        aria-hidden="true"
        className={clsx(
          "inline-block size-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-7" : "translate-x-1"
        )}
      />
    </HSwitch>
  );
}

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
