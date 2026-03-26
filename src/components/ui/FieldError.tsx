/**
 * FieldError.tsx
 * 
 * Form field error message component.
 * Displays validation error messages below form fields.
 */

/**
 * Renders an error message for form fields.
 * @param msg - Error message to display
 * @returns Error message paragraph or null if no message
 */
export default function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-sm text-red-600">{msg}</p> : null;
}

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
