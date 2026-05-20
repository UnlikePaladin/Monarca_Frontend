/*
 * VoucherHistory.tsx - Voucher history page component that displays a list of expense vouchers
 * associated with the current user. Allows deleting pending vouchers.
 */

import Table from "../../components/Refunds/Table";
import { useState, useEffect } from "react";
import { getRequest, deleteRequest } from "../../utils/apiService";
import formatDate from "../../utils/formatDate";
import RefreshButton from "../../components/RefreshButton";
import GoBack from "../../components/GoBack";
import { toast } from "react-toastify";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { FaTrash } from "react-icons/fa";
import formatMoney from "../../utils/formatMoney";

/**
 * Renders a styled status badge based on the voucher status.
 * @param {string} status - The current status of the voucher.
 * @returns {JSX.Element} A styled span element with the translated status text.
 */
const renderVoucherStatus = (status: string) => {
  let statusText = "";
  let styles = "";
  switch (status) {
    case "comprobante_pendiente":
    case "Pending":
      statusText = "Pendiente";
      styles = "text-[#55447a] bg-[#bea8ef]";
      break;
    case "Voucher Approved":
    case "Approved":
      statusText = "Aprobado";
      styles = "text-[#24390d] bg-[#c7e6ab]";
      break;
    case "Voucher Denied":
    case "Denied":
      statusText = "Denegado";
      styles = "text-[#680909] bg-[#eca6a6]";
      break;
    default:
      statusText = status;
      styles = "text-white bg-[#6c757d]";
  }
  return (
    <span className={`text-[10px] sm:text-xs p-1 rounded-sm whitespace-nowrap ${styles}`}>
      {statusText}
    </span>
  );
};

/**
 * VoucherHistory component - Displays a paginated table of voucher
 * history records for the current user.
 * @returns {JSX.Element} The voucher history page layout.
 */
export const VoucherHistory = () => {
  const [dataWithActions, setDataWithActions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  const fetchVouchers = async () => {
    try {
      const response = await getRequest("/vouchers/user");
      
      setDataWithActions(response?.map((record: any, index: number) => ({
        ...record,
        statusLabel: renderVoucherStatus(record.status),
        formattedDate: formatDate(record.date),
        formattedAmount: formatMoney(
          typeof record.amount_mxn === "number"
            ? record.amount_mxn
            : record.amount,
        ),
        tripTitle: record.requests?.title || "N/A",
        index,
        action: (
          <div className="flex justify-center gap-2">
            {(record.status === "comprobante_pendiente" || record.status === "Pending") && (
              <button
                onClick={() => {
                  setSelectedVoucherId(record.id);
                  setShowDeleteModal(true);
                }}
                className="text-red-500 hover:text-red-700 transition-colors p-1"
                title="Eliminar comprobante"
              >
                <FaTrash size={16} />
              </button>
            )}
          </div>
        ),
      })));
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Error al obtener el historial de comprobantes.");
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async () => {
    if (!selectedVoucherId) return;

    try {
      await deleteRequest(`/vouchers/${selectedVoucherId}`);
      toast.success("Comprobante eliminado con éxito.");
      fetchVouchers();
    } catch (error: any) {
      console.error("Error deleting voucher:", error);
      const message = error.response?.data?.message || "Error al eliminar el comprobante.";
      toast.error(message);
    } finally {
      setShowDeleteModal(false);
      setSelectedVoucherId(null);
    }
  };

  const COLUMNS_SCHEMA = [
    { key: "statusLabel", header: "Estado" },
    { key: "tripTitle", header: "Viaje" },
    { key: "class", header: "Clase" },
    { key: "formattedAmount", header: "Monto" },
    { key: "currency", header: "Moneda" },
    { key: "formattedDate", header: "Fecha" },
    { key: "action", header: "Acciones" },
  ];

  return (
    <>
      <div className="flex-1 max-w-full">
        <GoBack />
        <div className="p-4 sm:p-6 bg-[#eaeced] rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a2c6d]">
              Historial de comprobantes de gasto
            </h2>
            <RefreshButton onClick={() => fetchVouchers()} />
          </div>

          <div id="list_vouchers">
            <Table columns={COLUMNS_SCHEMA} data={dataWithActions} itemsPerPage={10} />
          </div>
          <p className="block sm:hidden text-center text-gray-500 text-[10px] mt-2 italic">
            Desliza hacia los lados para ver toda la información
          </p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVoucherId(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar comprobante"
        description="¿Estás seguro de que deseas eliminar este comprobante de gasto?"
        warningNote="Esta acción es permanente y no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </>
  );
};

export default VoucherHistory;
