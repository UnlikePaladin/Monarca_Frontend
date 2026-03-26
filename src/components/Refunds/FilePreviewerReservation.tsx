/**
 * FilePreviewerReservation.tsx
 * 
 * Component for previewing reservation voucher files (PDF only).
 * Displays file preview with price information and download option.
 */

import formatMoney from "../../utils/formatMoney";


interface FilePreviewerProps {
    file: {
        link: string;
        class: string;
        price: number;
    };
    fileIndex: number;
}

/**
 * Renders a reservation file preview with PDF viewer and price display.
 * @param file - File object containing link and price information
 * @param fileIndex - Index of the file in the list
 * @returns Reservation file previewer component with download option
 */
const FilePreviewer = ({ file, fileIndex }: FilePreviewerProps) => {
    return (
        <>
            <div className="grid grid-cols-3 w-full h-96 mb-4">
                <iframe
                  src={`${file.link}#navpanes=0&view=FitH`}
                  width="100%"
                  height="100%"
                  title={`Comprobante de Solicitud ${fileIndex + 1}`}
                  className="border-0 col-span-2"
                />

                <div className="flex flex-col bg-white p-6 gap-3 col-span-1">
                  <p id={`price-file-${fileIndex}`}><span className="font-semibold text-[var(--blue)]">Cantidad: </span><span className="text-green-700">{formatMoney(file.price)}</span></p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex space-x-4">
                  <a
                    id={`download-file-pdf-${fileIndex}`}
                    href={file.link}
                    download={`comprobante${fileIndex + 1}.pdf`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 hover:cursor-pointer"
                  >
                    Descargar PDF
                  </a>
                </div>
              </div>
        </>
    )
}

export default FilePreviewer;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, translated text to English, and added missing export.
*/