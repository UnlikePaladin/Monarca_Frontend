/**
 * Layout.tsx
 * 
 * Main layout wrapper component for authenticated pages.
 * Includes header, sidebar, footer, and handles authentication routing.
 */
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/authContext";
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useApp } from "../hooks/app/appContext";
import { IoIosHelpCircleOutline } from "react-icons/io";


// ****************** components ******************
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

/**
 * Renders the main application layout with authentication check.
 * Redirects unauthenticated users to login page.
 * @param children - Page content to render within the layout
 * @param title - Optional page title (currently unused)
 * @returns Layout with header, sidebar, footer and page content
 */
function Layout({ children }: { children: React.ReactNode }) {
  const { authState, loadingProfile } = useAuth();
  const { setTutorial } = useApp();

const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Check if the profile is loading
  // TODO: Replace with a loading spinner or skeleton
  if (loadingProfile) return <div className="flex h-screen items-center justify-center font-bold text-blue-900">Loading...</div>;

  // Check if the user is authenticated
  if (!authState.isAuthenticated) return <Navigate to="/" />;
    
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}/>
      <ToastContainer />
        <div className="flex flex-1 ">
        <Sidebar user={authState} isOpen={isSidebarOpen} />
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 lg:ml-[240px] pt-28 px-4 sm:px-10 pb-16">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      <button
        className="bg-[var(--blue)] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[var(--dark-blue)] transition-all fixed bottom-28 right-6 z-50 flex items-center sm:bottom-20"
        onClick={() => setTutorial(true)}
      >
        <IoIosHelpCircleOutline className="text-xl mr-2" />
        <span className="hidden sm:inline">Tutorial</span>
      </button>

      <div className="w-full lg:pl-[240px]">
        <Footer />
      </div>
      <ToastContainer />
    </div>
  );
}

export default Layout;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
- 2026-04-09 | Fabrizio | Implemented responsive logic, sidebar toggle state, and fixed tutorial button positioning.
- 2026-04-23 | Juan de Dios Gastélum | Removed overflow-hidden from main content wrapper to allow sticky positioning in child components.
*/
