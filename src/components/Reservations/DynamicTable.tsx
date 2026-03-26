/**
 * DynamicTable.tsx
 * 
 * Dynamic table component for reservations with editable cells.
 * Supports custom cell rendering and data change callbacks.
 */

import React, { useState, ReactNode } from "react";

interface Column {
  key: string;
  header: string;
  defaultValue?: string | number | boolean | null | undefined | ReactNode;
  renderCell?: (
    value: string | number | boolean | null | undefined | ReactNode,
    handleFieldChange: (
      newValue: string | number | boolean | null | undefined | ReactNode
    ) => void
  ) => React.ReactNode;
}

interface TableRow {
  [key: string]: string | number | boolean | null | undefined | ReactNode;
}

interface DynamicTableProps {
  columns: Column[];
  initialData?: TableRow[];
  onDataChange?: (data: TableRow[]) => void;
}

/**
 * Renders a dynamic table with editable cells for reservations.
 * @param columns - Array of column definitions
 * @param initialData - Initial data to populate the table
 * @param onDataChange - Callback function when data changes
 * @returns Dynamic table component
 */const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  initialData = [],
  onDataChange,
}) => {
  const [tableData, setTableData] = useState<TableRow[]>(
    initialData as TableRow[]
  );

  const handleFieldChange = (
    rowIndex: number,
    columnKey: string,
    newValue: string | number | boolean | null | undefined | ReactNode
  ): void => {
    const updatedData = [...tableData];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnKey]: newValue,
    };
    setTableData(updatedData);
    if (onDataChange) onDataChange(updatedData);
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
              <tr
                key={rowIndex}
                className="bg-[#4C6997] text-white text-center"
              >
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
                      ? column.renderCell(row[column.key], (newValue) =>
                          handleFieldChange(rowIndex, column.key, newValue)
                        )
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
