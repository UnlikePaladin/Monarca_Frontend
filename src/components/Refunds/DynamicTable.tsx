/**
 * DynamicTable.tsx
 * 
 * Dynamic table component with editable rows and columns for refunds.
 * Supports custom cell rendering and row management.
 */

import React, { useState, ReactNode } from "react";
import { HiOutlineTrash } from "react-icons/hi";
import { ConfirmationModal } from "../ui/ConfirmationModal";

// Define a type for all possible cell values including File objects
export type CellValueType =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactNode
  | File;

/**
 * Column interface schema to define the structure of each column in the table.
 * @property key - The key in the data object that corresponds to this column
 * @property header - The header text to display for this column
 * @property defaultValue - The default value to display in the cell
 * @property renderCell - Function to render custom components inside the cell
 */
export interface Column {
  key: string;
  header: string;
  defaultValue?: CellValueType;
  renderCell?: (
    value: CellValueType,
    handleFieldChange: (newValue: CellValueType) => void,
    rowIndex?: number,
    cellIndex?: number,
    patchRow?: (fields: Partial<TableRow>) => void
  ) => React.ReactNode;
}
/*
 * DynamicTableProps interface to define the structure of the props for the DynamicTable component.
 */
/* Interface for table row data structure */
export interface TableRow {
  [key: string]: CellValueType;
}

export interface DynamicTableProps {
  columns: Column[];
  initialData?: any[]; // Add proper typing here if known
  onDataChange?: (data: any[]) => void;
  expandedRows?: number[];
  renderExpandedRow?: (index: number) => React.ReactNode;
  showRowNumbers?: boolean;
  allowDelete?: boolean;
}

const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  initialData = [],
  onDataChange,
  expandedRows = [],
  renderExpandedRow,
  showRowNumbers = false,
  allowDelete = false,
}) => {
  /*
   * State to manage the table data.
   * The initial data is set to the initialData prop, or an empty array if not provided.
   * This is useful if there are data that is already loaded in the table.
   */
  const [tableData, setTableData] = useState<TableRow[]>(initialData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowIndexToDelete, setRowIndexToDelete] = useState<number | null>(null);

  // Sync internal state with prop if it changes from outside (e.g. after a partial upload failure)
  React.useEffect(() => {
    setTableData(initialData);
  }, [initialData]);

  /*
   * Function to handle changes in the table data.
   * It receives the row index, column key, and new value.
   * Using TableRow interface defined above
   */
  const handleFieldChange = (
    rowIndex: number,
    columnKey: string,
    newValue: CellValueType
  ): void => {
    setTableData((prev) => {
      const updatedData = [...prev];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        [columnKey]: newValue,
      };
      if (onDataChange) {
        onDataChange(updatedData);
      }
      return updatedData;
    });
  };

  /** Uses functional updates so async callers (e.g. CFDI preview) never merge into stale rows and drop File fields. */
  const patchRowFields = (rowIndex: number, partial: Partial<TableRow>): void => {
    setTableData((prev) => {
      const updatedData = [...prev];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        ...partial,
      };
      if (onDataChange) {
        onDataChange(updatedData);
      }
      return updatedData;
    });
  };

  const addItem = () => {
    const defaultRow = columns.reduce((obj, column) => {
      obj[column.key] = column.defaultValue || "";
      return obj;
    }, {} as Record<string, any>); // Ensure proper typing of the default row

    /* Add the new row to the tableData state */
    const updatedData = [...tableData,defaultRow];
    setTableData(updatedData);

    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const handleDeleteRow = (index: number) => {
    setRowIndexToDelete(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (rowIndexToDelete === null) return;

    setTableData((prev) => {
      const updatedData = prev.filter((_, i) => i !== rowIndexToDelete);
      if (onDataChange) {
        onDataChange(updatedData);
      }
      return updatedData;
    });

    setDeleteModalOpen(false);
    setRowIndexToDelete(null);
  };

  // Function to render cell content safely
  const renderCellContent = (value: CellValueType): React.ReactNode => {
    if (value instanceof File) {
      return value.name; // Show the filename instead of the File object
    }

    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object" && !React.isValidElement(value)) {
      return JSON.stringify(value);
    }

    return value;
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-1">
          <thead>
            <tr className="text-xs text-white uppercase bg-[#0a2c6d]">
              {showRowNumbers && (
                <th className="px-3 py-2 text-center rounded-l-lg">Fila</th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-3 py-2 text-center ${
                    index === 0 && !showRowNumbers ? "rounded-l-lg" : ""
                  } ${index === columns.length - 1 && !allowDelete ? "rounded-r-lg" : ""}`}
                >
                  {column.header}
                </th>
              ))}
              {allowDelete && (
                <th className="px-3 py-2 text-center rounded-r-lg">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr className="bg-[#4C6997] text-white text-center">
                  {showRowNumbers && (
                    <td className="px-3 py-2 rounded-l-lg font-semibold">
                      {rowIndex + 1}
                    </td>
                  )}
                  {columns.map((column, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`overflow-visible px-3 py-2 ${
                        cellIndex === 0 && !showRowNumbers ? "rounded-l-lg" : ""
                      } ${
                        cellIndex === columns.length - 1 && !allowDelete ? "rounded-r-lg" : ""
                      }`}
                    >
                      {
                        /*
                         * Here render the cell data, if the column has a renderCell function (that means a component)
                         * we call it and pass the parameters to it, the value for the component to display it and an
                         * anonymous function to update the state of the data localy, please see the definition of the
                         * column interface to understand why an value and a function are passed to the renderCell function.
                         * If there is no renderCell function, we just display the value of the cell like a static text.
                         *
                         * This can be a tricky of understanding, so please reach me José Manuel García Zumaya if you have any question about this.
                         */
                        column.renderCell
                          ? column.renderCell(
                              row[column.key],
                              (newValue) =>
                                handleFieldChange(
                                  rowIndex,
                                  column.key,
                                  newValue
                                ),
                              rowIndex,
                              cellIndex,
                              (fields) => patchRowFields(rowIndex, fields)
                            )
                          : renderCellContent(row[column.key])
                      }
                    </td>
                  ))}
                  {allowDelete && (
                    <td className="px-3 py-2 rounded-r-lg text-center">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Eliminar fila"
                      >
                        <HiOutlineTrash className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>

                {/* Expanded row (optional) */}
                {expandedRows.includes(rowIndex) && renderExpandedRow && (
                  <tr className="bg-[#f4f6f8] text-black">
                    <td colSpan={columns.length} className="px-6 py-4">
                      {renderExpandedRow(rowIndex)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center">
        <button
          id="add-item-button"
          onClick={addItem}
          className="px-4 py-2 bg-[#0a2c6d] text-white rounded-md hover:bg-[#0d3d94] transition-colors hover:cursor-pointer"
        >
          + Añadir comprobante de gasto
        </button>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar comprobante"
        description="¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer y se perderán todos los datos capturados y archivos subidos para esta fila."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};

export default DynamicTable;

/*
Modification History:

- 2025-04-29 | José Manuel García Zumaya | Initial creation.
- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated text to English.
*/
