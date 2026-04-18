/*
Policies.tsx
Main view for accounting policies management, exclusive to the SOI role.
*/

import { useEffect } from "react";
import Mosaic from "../components/Mosaic";
import GoBack from "../components/GoBack";
import { useApp } from "../hooks/app/appContext";

/**
 * Component that renders the policy options menu (Advances, Vouchers).
 * It uses the Mosaic component to maintain visual consistency.
 */
export const PoliciesDashboard = () => {
  const { setPageTitle } = useApp();

  useEffect(() => {
    setPageTitle("Gestión de Pólizas");
  }, [setPageTitle]);

  return (
    <div className="max-w-5xl mx-auto">
      <GoBack />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-6 py-10">
        <Mosaic 
          title="Pólizas de anticipos" 
          iconPath="/assets/advance_payment_policy.png" 
          link="#" 
        />
        <Mosaic 
          title="Pólizas de comprobaciones" 
          iconPath="/assets/verification_policies.png" 
          link="#" 
        />
        <Mosaic 
          title="Pólizas de comprobaciones (sin anticipo)" 
          iconPath="/assets/verification_policies_n_p.png" 
          link="#" 
        /> 
      </div>
    </div>
  );
};

export default PoliciesDashboard;

/*
Modification History:
-2026-04-14 | Fabrizio | Initial creation of the policies dashboard view for SOI.
*/