/**
 * RefreshButton.tsx
 * 
 * Reusable refresh button component with icon.
 * Displays a refresh icon that can be used to trigger refresh actions.
 */

import { MdRefresh } from "react-icons/md";

interface RefreshButtonProps {
    onClick?: () => void;
}

/**
 * Renders a refresh button with icon.
 * @param onClick - Optional handler invoked when the button is clicked.
 * @returns Button component with refresh icon
 */
const RefreshButton = ({ onClick }: RefreshButtonProps) => {

    return (
        <button
            type="button"
            onClick={onClick}
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