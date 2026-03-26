/**
 * Footer.tsx
 * 
 * Main footer component for the Monarca application.
 * Displays copyright information and legal links.
 */

/**
 * Renders the application footer with copyright and legal information.
 * @returns Footer component with copyright notice and policy links
 */
function Footer() {
    return (
        <footer className="w-full bg-[var(--dark-blue)] text-[var(--white)]">
            <div className="max-w-screen-xl mx-auto p-5 flex justify-between items-center text-xs">
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
*/