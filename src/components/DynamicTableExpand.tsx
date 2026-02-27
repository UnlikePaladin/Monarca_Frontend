/**
 * DynamicTableExpand.tsx
 * 
 * Dynamic table component with expandable rows functionality.
 * Renders a table with dynamic rows and columns, supporting custom cell rendering.
 */

import React, { useState } from "react";

/**
 * Column interface schema to define the structure of each column in the table.
 * @property key - The key in the data object that corresponds to this column
 * @property header - The header text to display for this column
 * @property defaultValue - The default value to display in the cell
 * @property renderCell - Function to render custom components inside the cell
 */
interface Column {
  key: string;
  header: string;
  defaultValue?: string | number | boolean | null | undefined | React.ReactNode;
  renderCell?: (
    value: string | number | boolean | null | undefined | React.ReactNode,
    handleFieldChange: Function,
    rowIndex?: number
  ) => React.ReactNode;
}

/**
 * DynamicTableExpandProps interface to define the structure of the props.
 * @property columns - Array of Column objects defining the table's columns
 * @property initialData - Optional initial data array to populate the table
 * @property onDataChange - Callback function called when data changes
 * @property expandedRows - Indices of expanded rows
 * @property renderExpandedRow - Function that renders the expanded content below the row
 */
interface DynamicTableExpandProps {
  columns: Column[];
  initialData?: Record<string, any>[];
  onDataChange?: (data: Record<string, any>[]) => void;
  expandedRows?: number[];
  renderExpandedRow?: (index: number) => React.ReactNode;
}

/*
 * DynamicTableExpand component that renders a table with dynamic rows and columns.
 * It allows adding new rows and updating existing ones.
 */
const DynamicTableExpand: React.FC<DynamicTableExpandProps> = ({
  columns,
  initialData = [],
  onDataChange,
  expandedRows = [],
  renderExpandedRow,
}) => {
  const [tableData, setTableData] = useState<Record<string, any>[]>(initialData as Record<string, any>[]);

  const handleFieldChange = (
    rowIndex: number,
    columnKey: string,
    newValue: string | number | boolean | null | undefined | React.ReactNode
  ) => {
    const updatedData = [...tableData];

    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnKey]: newValue,
    };

    setTableData(updatedData);

    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const addItem = () => {
    const defaultRow = columns.reduce((obj: Record<string, any>, column) => {
      obj[column.key] = column.defaultValue || "";
      return obj;
    }, {} as Record<string, any>);

    const updatedData = [...tableData, defaultRow];
    setTableData(updatedData);

    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs text-white uppercase bg-[#0a2c6d]">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-2 text-center ${
                    index === 0 ? "rounded-l-lg" : ""
                  } ${index === columns.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr className="bg-[#4C6997] text-white text-center">
                  {columns.map((column, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-4 py-3 ${
                        cellIndex === 0 ? "rounded-l-lg" : ""
                      } ${
                        cellIndex === columns.length - 1 ? "rounded-r-lg" : ""
                      }`}
                    >
                      {column.renderCell
                        ? column.renderCell(
                            row[column.key],
                            (newValue: any) =>
                              handleFieldChange(rowIndex, column.key, newValue),
                            rowIndex
                          )
                        : row[column.key]}
                    </td>
                  ))}
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
          onClick={addItem}
          className="px-4 py-2 bg-[#0a2c6d] text-white rounded-md hover:bg-[#0d3d94] transition-colors hover:cursor-pointer"
        >
          + Añadir comprobante de gasto
        </button>
      </div>
    </div>
  );
};

export default DynamicTableExpand;

/*
Modification History:

- 2025-04-24 | José Manuel García Zumaya | Initial creation with expandable rows.
- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated comments to English.
*/
