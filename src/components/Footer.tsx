/**
 * Footer.tsx
 * 
 * Main footer component for the Monarca application.
 * Displays copyright information and legal links.
 */

/**
 * Renders the application footer with copyright and legal information.
 * @returns Footer component with copyright notice and policy links.
 * Responsive Footer component.
 */
function Footer() {
    return (
        <footer className="w-full bg-[var(--dark-blue)] text-[var(--white)] border-t border-blue-900">
            <div className="max-w-screen-xl mx-auto p-5 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs gap-3 text-center sm:text-left">
                <p>Copyright © {new Date().getFullYear()} 02 Solutions.</p>
                <p>All Rights Reserved | Terms and Conditions | Privacy Policy</p>
            </div>
        </footer>
    )
}

export default Footer;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
- 2026-04-09 | Fabrizio | Added flex-col for mobile to prevent text overlapping.
*/