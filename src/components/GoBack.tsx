/**
 * GoBack.tsx
 * 
 * Navigation button component that redirects users back to the dashboard.
 * Uses React Router for navigation with an arrow icon.
 */

import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

/**
 * Renders a back button that navigates to the dashboard.
 * @returns Button component with left arrow icon and back text
 */
const GoBack = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate("/dashboard")}
            aria-label="Regresar"
            type="button"
            className="mb-6 text-sm w-fit text-[var(--blue)] hover:text-[var(--dark_blue)] flex items-center gap-2 justify-center"

        >
            <FaArrowLeft /> Regresar
        </button>
    )
}

export default GoBack;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated text to English.
*/