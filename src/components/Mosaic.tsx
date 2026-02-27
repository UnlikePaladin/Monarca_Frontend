/**
 * Mosaic.tsx
 * 
 * Card component that displays a title, icon, and navigates to a specific route.
 * Used primarily for dashboard navigation tiles.
 */

import { Link } from "react-router-dom"

interface MosaicProps {
  title: string;
  iconPath: string;
  link: string;
  id?: string;
}

/**
 * Renders a clickable card tile with an icon and title.
 * @param title - Text to display on the card
 * @param iconPath - Path to the icon image
 * @param link - Route to navigate to when clicked
 * @param id - Optional HTML id attribute
 * @returns Mosaic card component
 */
const Mosaic = ({ title, iconPath, link, id}: MosaicProps) => {

    return (
        <Link to={link} data-cy={`mosaic-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          <div
          className="relative bg-[#F4F6F8] w-64 h-30 rounded-2xl shadow-md flex items-end justify-center hover:shadow-lg transition-shadow duration-300 ease-in-out"
          id={id ? id : undefined}
        >
          <div className="absolute -top-8 bg-[#2C64C6] w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
            <img src={iconPath} alt={title} />
          </div>
          <p className="text-center text-[#001233] font-extrabold text-base pb-3 leading-tight px-2">
            {title}
          </p>
        </div>
        </Link>
    )
}

export default Mosaic;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/