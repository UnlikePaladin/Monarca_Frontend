import React, { useState } from "react";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  title: string;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      toast.error("Ambas fechas son obligatorias");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha de fin");
      return;
    }

    onConfirm(startDate, endDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-[var(--blue)]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Selecciona el rango de fechas de viaje para filtrar las pólizas que deseas descargar.
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de fin
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--blue)] hover:bg-[var(--dark-blue)] rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Generar JSON
          </button>
        </div>
      </div>
    </div>
  );
};
