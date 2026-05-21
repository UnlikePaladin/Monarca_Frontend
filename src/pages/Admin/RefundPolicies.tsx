import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useApp } from "../../hooks/app/appContext";
import { useGetRefundPolicies } from "../../hooks/refundPolicies/useGetRefundPolicies";
import { useDeleteRefundPolicy } from "../../hooks/refundPolicies/useDeleteRefundPolicy";
import { useGetRefundPolicy } from "../../hooks/refundPolicies/useGetRefundPolicy";
import { RefundPolicy } from "../../types/refundPolicies";
import { RefundPoliciesList } from "../../components/refundPolicies/RefundPoliciesList";
import { RefundPolicyForm } from "../../components/refundPolicies/RefundPolicyForm";
import { RefundPolicyDetail } from "../../components/refundPolicies/RefundPolicyDetail";
import { Tutorial } from "../../components/Tutorial";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";

type ViewMode = "list" | "create" | "edit" | "detail";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    }

    if (error.response?.status === 403) {
      return "No tienes permisos para administrar estas políticas.";
    }

    if (error.response?.status === 404) {
      return "No se encontró la política solicitada.";
    }

    if (error.response?.data) {
      const responseData = error.response.data as { message?: unknown };
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }
  }

  return fallback;
};

function RefundPolicies() {
  const { setPageTitle, handleVisitPage, tutorial, setTutorial } = useApp();
  const { authState } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPolicy, setSelectedPolicy] = useState<RefundPolicy | null>(null);

  const {
    data: groups = [],
    isLoading,
    isError,
    error,
  } = useGetRefundPolicies();

  const {
    data: detailedPolicy,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useGetRefundPolicy(viewMode === "detail" ? selectedPolicy?.id : undefined);

  const {
    data: profileCompany,
  } = useGetCompany(authState.userCompanyId);

  const { mutateAsync: deletePolicy, isPending: isDeleting } = useDeleteRefundPolicy();

  useEffect(() => {
    setPageTitle("Políticas de Reembolso");
  }, [setPageTitle]);

  useEffect(() => {
    const visitedPages = JSON.parse(localStorage.getItem("visitedPages") || "[]");
    const isPageVisited = visitedPages.includes(location.pathname);

    if (!isPageVisited) {
      setTutorial(true);
    }

    handleVisitPage();
  }, [handleVisitPage, setTutorial]);

  const totalPolicies = useMemo(
    () => groups.reduce((acc, group) => acc + group.policies.length, 0),
    [groups]
  );

  const fallbackCompany = useMemo(() => {
    if (!profileCompany) return undefined;

    return {
      id: profileCompany.id,
      key: profileCompany.key,
      name: profileCompany.name,
    };
  }, [profileCompany]);

  const handleCreate = () => {
    setSelectedPolicy(null);
    setViewMode("create");
  };

  const handleEdit = (policy: RefundPolicy) => {
    setSelectedPolicy(policy);
    setViewMode("edit");
  };

  const handleView = (policy: RefundPolicy) => {
    setSelectedPolicy(policy);
    setViewMode("detail");
  };

  const handleCloseForm = () => {
    setSelectedPolicy(null);
    setViewMode("list");
  };

  const handleDelete = async (policy: RefundPolicy) => {
    const confirmed = confirm(`¿Seguro que deseas eliminar la política "${policy.name}"?`);
    if (!confirmed) return;

    try {
      await deletePolicy(policy.id);
      toast.success("Política eliminada correctamente", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Error al eliminar la política"), {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <Tutorial page="refundPolicies" run={tutorial}>
      <div className="px-16 pt-32 flex-1 pb-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div id="refund_policies_overview">
            <h1 className="text-2xl font-bold text-gray-900">Políticas de Reembolso</h1>
            <p className="text-xs text-gray-500 mt-2">Total actual: {totalPolicies} políticas</p>
          </div>

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getErrorMessage(error, "No se pudieron cargar las políticas.")}
            </div>
          )}

          {viewMode === "list" && (
            <RefundPoliciesList
              groups={groups}
              isLoading={isLoading}
              onCreate={handleCreate}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {viewMode === "create" && (
            <RefundPolicyForm
              groups={groups}
              fallbackCompany={fallbackCompany}
              onClose={handleCloseForm}
            />
          )}

          {viewMode === "edit" && selectedPolicy && (
            <RefundPolicyForm
              policy={selectedPolicy}
              groups={groups}
              fallbackCompany={fallbackCompany}
              onClose={handleCloseForm}
            />
          )}

          {viewMode === "detail" && selectedPolicy && (
            <>
              {isLoadingDetail ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-sm text-gray-500">
                  Cargando detalle de la política...
                </div>
              ) : detailError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {getErrorMessage(detailError, "No se pudo cargar el detalle de la política.")}
                </div>
              ) : detailedPolicy ? (
                <RefundPolicyDetail
                  policy={detailedPolicy}
                  onClose={handleCloseForm}
                  onEdit={handleEdit}
                />
              ) : null}
            </>
          )}

          {isDeleting && (
            <p className="text-xs text-gray-500">Procesando eliminación...</p>
          )}

          <div id="refund_policies_tutorial_end" className="sr-only">
            Tutorial de políticas de reembolso
          </div>
        </div>
      </div>
    </Tutorial>
  );
}

export default RefundPolicies;
