/*This Unauthorized component renders an access-denied page that is shown when a user attempts to access a route without the required permissions. It displays a clear “Acceso no autorizado” message, explains that the user does not have permission to view the page, and suggests contacting an administrator if it is an error. The page provides two navigation options using React Router Link: one to return to the dashboard and another to go back to the login page. The layout is styled with Tailwind CSS in a centered card design on a dark background, including an error icon for visual emphasis. */

import { Link } from "react-router-dom";

export const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 text-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400">
            Acceso no autorizado
          </h1>
          <div className="mt-4 text-gray-300">
            <p>No tienes permiso para acceder a esta página.</p>
            <p className="mt-2">
              Contacta a un administrador si crees que esto es un error.
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-700">
          <Link
            to="/dashboard"
            className="block w-full py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Ir al Panel
          </Link>
          <Link
            to="/"
            className="block w-full py-2 mt-3 text-center text-white bg-gray-600 rounded hover:bg-gray-500 transition-colors"
          >
            Ir a la Página de Iniciar Sesión
          </Link>
        </div>
        <div className="flex justify-center pt-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png"
            alt="Error icon"
            className="w-12 h-12 opacity-70"
          />
        </div>
      </div>
    </div>
  );
};
