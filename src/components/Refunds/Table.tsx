/**
 * Table.tsx
 * 
 * Paginated table component with customizable columns for refunds.
 * Displays data in a table format with pagination controls.
 */

import React, { ReactNode, useState } from "react";

/**
 * Column interface schema to define the structure of each column in the table.
 * @property key - The key in the data object that corresponds to this column
 * @property header - The header text to display for this column
 */
interface Column {
  key: string;
  header: string;
}

export type ServerPaginationConfig = {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

/**
 * TableProps interface to define the structure of the props for the Table component.
 * @property columns - Array of Column objects defining the table's columns
 * @property data - Array of objects representing the rows of the table
 * @property itemsPerPage - Number of items to display per page (default: 5)
 * @property serverPagination - When set, `data` is the current server page only; totals and page changes come from the parent.
 */
interface TableProps {
  columns: Array<Column>;
  data: Array<{
    [key: string]: string | number | boolean | null | undefined | ReactNode;
  }>;
  itemsPerPage?: number;
  serverPagination?: ServerPaginationConfig;
}

/*
 * IMPORTANT: Note the key property in the Column and TableProps interfaces, since the way that
 * this works is that the key in the Column interface is used to access the data in the data array,
 * so with this form we can access the data dynamically in our object data and show it in the table.
 */

/*
 * Table component that renders a table based on the provided columns and data with pagination controls.
 */
const Table: React.FC<TableProps> = ({
  columns,
  data,
  itemsPerPage = 5,
  serverPagination,
}) => {
  const [clientPage, setClientPage] = useState(1);

  const isServer = Boolean(serverPagination);
  const currentPage = isServer
    ? serverPagination!.currentPage
    : clientPage;

  const totalItems = isServer
    ? serverPagination!.totalItems
    : data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = isServer
    ? data
    : data.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    let next = page;
    if (next < 1) next = 1;
    if (next > totalPages) next = totalPages;
    if (isServer) {
      serverPagination!.onPageChange(next);
    } else {
      setClientPage(next);
    }
  };

  const pagingDisabled = Boolean(serverPagination?.isLoading);

  return (
    <div className="relative">
      {/* Table component */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs text-white uppercase bg-[#0a2c6d]">
              {/*
               * Contruct the headers of the table, based on colum property
               * Use the index to rounded the borders of the cell.
               */}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-2 text-center ${
                    index === 0 ? "rounded-l-lg" : ""
                  } ${index === columns.length - 1 ? "rounded-r-lg" : ""}
                    ${column.key === "status" ? "min-w-[150px]" : ""
                  } ${
                    column.key === "status" ? "px-0" : "px-4"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/*
             * Contruct the rows of the table, based on currentItems array,
             * currentItems is the sliced data array based on the current page
             * and itemsPerPage.
             *
             * THE LOGIC IS for each row of data in the currentItems array,
             * we create a new row in the table, and then for each colum (headers)
             * in the colums array, we create a new cell in the current row, finally
             * access the data by colum.key in the row data, to display in the correct place.
             */}
            {currentItems.length <= 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center pt-10">
                  No hay datos disponibles
                </td>
              </tr>
            ) : currentItems.map((row, rowIndex) => (
              <tr
                key={
                  row.id !== undefined && row.id !== null
                    ? String(row.id)
                    : rowIndex
                }
                className="bg-[#4C6997] text-white text-center"
              >
                {/*
                 * And then we use another map function to iterate over each column
                 * in the columns array to create the cells data of the table.
                 * Use the cellIndex to rounded the borders of the cell.
                 */}
                {columns.map((column, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`py-3 ${
                      cellIndex === 0 ? "rounded-l-lg" : ""
                    } ${
                      cellIndex === columns.length - 1 ? "rounded-r-lg" : ""
                    } ${
                      column.key === "status" ? "px-1" : "px-4"
                    }`}
                  >
                    {/*
                     * Access to data by colum.key in the row data, to display in the correct place
                     * Check if the data for this cell is defined, if not show N/A.
                     */}
                    {row[column.key] !== undefined && row[column.key] !== null
                      ? /*
                         * Render the data, that might be number, string, boolean or ReactNode.
                         * Note here access the data through the key property of the column object
                         * to get the value from the row object. This is important because we are
                         * using the key property to access the data dynamically in our object data.
                         */
                        row[column.key]
                      : "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
       * Pagination controls
       * The buttons call the changePage function of useState hook to update the current page.
       */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          {/* Disable the button if we are in the first or final page */}
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1 || pagingDisabled}
            className="px-3 py-1 rounded-lg bg-[#0a2c6d] text-white disabled:opacity-50 hover:cursor-pointer"
            aria-label="Previous page"
          >
            &lt;
          </button>

          <span className="text-[#0a2c6d] font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages || pagingDisabled}
            className="px-3 py-1 rounded-lg bg-[#0a2c6d] text-white disabled:opacity-50 hover:cursor-pointer"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;

/*
Modification History:

- 2025-04-20 | José Manuel García Zumaya | Initial creation.
- 2026-02-26 | Santiago Arista | Added file description and JSDoc documentation.
*/
