/*his NotFound component renders a custom 404 error page displayed when a user navigates to a route that does not exist. It shows a large “404” heading, a message explaining that the page was not found or may have been moved, and provides two navigation options using React Router Link: one to return to the home page (/) and another to go directly to the dashboard (/dashboard). The layout is styled with Tailwind CSS for a centered card design on a dark background, and it includes a decorative 404 icon image at the bottom. */

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 text-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-blue-500">404</h1>
          <p className="mt-4 text-xl font-semibold">Página no encontrada</p>
          <p className="mt-2 text-gray-300">
            Lo sentimos, la página que estás buscando no existe o fue movida.
          </p>
        </div>
        <div className="pt-4 border-t border-gray-700">
          <Link
            to="/"
            className="block w-full py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Ir al Inicio
          </Link>
          <Link
            to="/dashboard"
            className="block w-full py-2 mt-3 text-center text-white bg-gray-600 rounded hover:bg-gray-500 transition-colors"
          >
            Ir al Panel
          </Link>
        </div>
        <div className="flex justify-center pt-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2748/2748558.png"
            alt="404 icon"
            className="w-25 h-25 opacity-70"
          />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
