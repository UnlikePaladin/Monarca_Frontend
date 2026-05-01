/**
 * Description: Page for managing substitute delegations.
 *              Accessible only to CompanyAdmin users.
 */

import { useEffect } from "react";
import { SubstitutePanel } from "../../components/SubstitutePanel";
import { ActiveDelegationsList } from "../../components/substitutes/ActiveDelegationsList";
import { useApp } from "../../hooks/app/appContext";

/**
 * Renders the substitute delegation management page.
 * @returns React page component for delegation administration.
 */
const Roles = () => {
  const { setPageTitle } = useApp();

  useEffect(() => {
    setPageTitle("Delegaciones de Sustitutos");
  }, []);

  return (
    <div className="px-16 pt-32 flex-1 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Delegaciones de Sustitutos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona delegaciones temporales de roles para usuarios sustitutos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <SubstitutePanel />
          <ActiveDelegationsList />
        </div>
      </div>
    </div>
  );
};

export default Roles;

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-27 | Juan de Dios Gastélum Flores | Removed role creation tab; page now only exposes substitute delegation management.
 */