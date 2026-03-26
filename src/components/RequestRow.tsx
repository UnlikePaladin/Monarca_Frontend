/**
 * RequestRow.tsx
 * 
 * Travel request view component with editable table, dropdowns, inputs, and actions.
 * Displays employee information and travel request details in an interactive table.
 */

import { useState } from "react";
import Button from "../components/Refunds/Button";
import DynamicTable from "../components/Refunds/DynamicTable";
import InputField from "../components/Refunds/InputField";
import Dropdown from "../components/Refunds/DropDown";
// import { FaSyncAlt } from "react-icons/fa";

// Dropdown options for status field
const STATUS_OPTIONS = [
  { value: "autorizado", label: "Autorizado" },
  { value: "pendiente", label: "Pendiente" },
];

// Dropdown options for currency field
const MONEDA_OPTIONS = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
];

/**
 * Renders an editable table with travel request data.
 * Includes editable fields, pagination controls, and employee metadata.
 * @returns RequestRow component with table and employee information
 */
const RequestRow = () => {
  // State to store data for each table row
  const [data, setData] = useState([
    {
      id: "0001",
      date: "14/09/2020",
      city: "Cancún",
      country: "MX",
      reason: "Viaje",
      status: "autorizado",
      settlement: "A liquidar",
      refund: "$100",
      currency: "MXN",
    },
    {
      id: "0002",
      date: "14/09/2020",
      city: "CDMX",
      country: "MX",
      reason: "Auditoría",
      status: "autorizado",
      settlement: "Comprobado",
      refund: "$200",
      currency: "MXN",
    },
  ]);

  // Configuración de columnas para la tabla editable
  const columns = [
    {
      key: "status",
      header: "Autorización",
      defaultValue: "pendiente",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <Dropdown
          value={value ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "id",
      header: "Viaje",
      defaultValue: "",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "date",
      header: "Fecha Salida",
      defaultValue: "",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          type="date"
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "city",
      header: "Población",
      defaultValue: "",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "country",
      header: "País",
      defaultValue: "MX",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "reason",
      header: "Razón",
      defaultValue: "",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "settlement",
      header: "Comprobación",
      defaultValue: "",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "refund",
      header: "Reembolso",
      defaultValue: "$0",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <InputField
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
    {
      key: "currency",
      header: "Moneda",
      defaultValue: "MXN",
      renderCell: (
        value: string | undefined,
        handleChange: (val: string) => void,
        _rowIndex?: number
      ) => (
        <Dropdown
          value={value ?? ""}
          options={MONEDA_OPTIONS}
          onChange={(e) => handleChange(e.target.value)}
        />
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {/* Encabezado con botón de acción y refresco */}
      <div className="flex items-center justify-between mb-6">
        <Button
          label="Viajes"
          className="bg-[#0a2c6d] text-white px-5 py-2 rounded-md"
        />
        {/* <FaSyncAlt className="text-[#0a2c6d] text-2xl cursor-pointer" /> */}
      </div>

      {/* Tabla editable con componentes personalizados */}
      <DynamicTable
        columns={columns as any}
        initialData={data}
        onDataChange={setData}
      />

      {/* Información adicional del empleado */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm text-[#0a2c6d] font-medium">
        <div className="bg-gray-100 p-2 rounded">Empleado: 000001</div>
        <div className="bg-gray-100 p-2 rounded">Nombre: Juan Pérez</div>
        <div className="bg-gray-100 p-2 rounded">Acreedor: 000001</div>
        <div className="bg-gray-100 p-2 rounded">Posición: 000001</div>
        <div className="bg-gray-100 p-2 rounded">Correo: juan@mail.com</div>
        <div className="bg-gray-100 p-2 rounded">Sociedad: 000001</div>
      </div>
    </div>
  );
};

export default RequestRow;

/*
Modification History:

- 2025-04-25 | Isaac | Initial creation with editable table.
- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated text to English.
*/
