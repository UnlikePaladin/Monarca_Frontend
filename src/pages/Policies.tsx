/*
Policies.tsx
Main view for accounting policies management, exclusive to the SOI role.
*/

import { useEffect } from "react";
import Mosaic from "../components/Mosaic";
import GoBack from "../components/GoBack";
import { useApp } from "../hooks/app/appContext";
import { getRequest } from "../utils/apiService";
import { toast } from "react-toastify";

/**
 * Component that renders the policy options menu (Advances, Vouchers).
 * It uses the Mosaic component to maintain visual consistency.
 */
export const PoliciesDashboard = () => {
  const { setPageTitle } = useApp();

  useEffect(() => {
    setPageTitle("Gestión de Pólizas");
  }, [setPageTitle]);

  const handleDownloadAdvancePolicies = async () => {
    try {
      const data = await getRequest("/policy-exports/advance-policies");
      
      const fileName = `polizas_anticipo_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Pólizas de anticipos descargadas con éxito.");
    } catch (error: any) {
      console.error("Error downloading advance policies:", error);
      const msg = error.response?.data?.message || "No se pudieron generar las pólizas de anticipos.";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <GoBack />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-6 py-10">
        <Mosaic 
          title="Pólizas de anticipos" 
          iconPath="/assets/advance_payment_policy.png" 
          link="#"
          onClick={handleDownloadAdvancePolicies}
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
-2026-04-23 | Katia Alvarez | Added onClick handler for custom actions (e.g. downloads).
*/