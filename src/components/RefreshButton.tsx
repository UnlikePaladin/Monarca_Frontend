/**
 * RefreshButton.tsx
 * 
 * Reusable refresh button component with icon.
 * Displays a refresh icon that can be used to trigger refresh actions.
 */

import { MdRefresh } from "react-icons/md";

/**
 * Renders a refresh button with icon.
 * @returns Button component with refresh icon
 */
const RefreshButton = () => {

    return (
        <button
            className="p-2 bg-white rounded-md shadow hover:bg-gray-100"
        >
            <MdRefresh className="h-6 w-6 text-[#0a2c6d]" />
        </button>
    )

}


export default RefreshButton;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/