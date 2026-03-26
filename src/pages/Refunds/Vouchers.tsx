/*This component (Vouchers) renders a refund/voucher submission form for a specific trip request, allowing the user to enter multiple expense rows and upload the supporting XML/PDF files for each one. It reads the request id from the URL, fetches the trip details with GET /requests/{id}, and displays basic trip info (ID, title, destination city, and formatted advance amount). The core UI is a DynamicTable whose column schema defines how each cell is rendered: dropdowns for expense class and tax indicator (using spendOptions and taxIndicatorOptions), inputs for amount and voucher date, and file inputs for XML and PDF uploads that store the selected files into the formData state. When the user clicks “Enviar Solicitud,” it loops through each table row, builds a FormData payload (including request ID, class, amount, tax type, status, currency, and attached files), uploads each voucher via POST /vouchers/upload, then marks the request as finished uploading vouchers with PATCH /requests/finished-uploading-vouchers/{id} and navigates back to /refunds, showing success/error toasts as appropriate. The page also includes a comment input (stored locally), a cancel link, a back button, and is wrapped in a Tutorial flow. */

import { Link, useNavigate } from "react-router-dom";
import DynamicTable, {
  TableRow as DynamicTableRow,
  CellValueType,
} from "../../components/Refunds/DynamicTable";
import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import InputField from "../../components/Refunds/InputField";
import Dropdown from "../../components/Refunds/DropDown";
import { spendOptions, taxIndicatorOptions } from "./local/dummyData";
import { getRequest, patchRequest, postRequest } from "../../utils/apiService";
import { useParams } from "react-router-dom";
import formatMoney from "../../utils/formatMoney";
import { toast } from "react-toastify";
import GoBack from "../../components/GoBack";
import { Tutorial } from "../../components/Tutorial";

interface FormDataRow extends DynamicTableRow {
  spentClass: string;
  amount: number;
  taxIndicator: string;
  date: string;
  XMLFile?: File;
  PDFFile?: File;
}
interface Trip {
  id: number | string;
  title: string;
  advance_money: number;
  destination: {
    city: string;
  };
}

interface UploadVoucherErrorResponse {
  message?: string;
  errorCode?: string;
  missingFields?: string[];
}

interface UploadFailureDetail {
  rowNumber: number;
  reason: string;
  rowData: FormDataRow;
}

interface UploadResult {
  rowNumber: number;
  status: "success" | "failed";
  reason?: string;
}

const getUploadErrorMessage = (errorData?: UploadVoucherErrorResponse) => {
  if (!errorData) {
    return "Error al subir el comprobante. Verifica los datos e inténtalo de nuevo.";
  }

  const details: string[] = [];

  if (errorData.message) {
    details.push(errorData.message);
  }

  if (errorData.errorCode) {
    details.push(`Código: ${errorData.errorCode}`);
  }

  if (errorData.missingFields?.length) {
    details.push(`Campos faltantes: ${errorData.missingFields.join(", ")}`);
  }

  return details.length
    ? details.join(" | ")
    : "Error al subir el comprobante. Verifica los datos e inténtalo de nuevo.";
};

const getUploadUserMessage = (errorData?: UploadVoucherErrorResponse) => {
  if (!errorData) {
    return "No pudimos subir este comprobante. Verifica los datos e inténtalo de nuevo.";
  }

  const details: string[] = [];

  if (errorData.message) {
    details.push(errorData.message);
  }

  if (errorData.missingFields?.length) {
    details.push(`Revisa estos campos: ${errorData.missingFields.join(", ")}.`);
  }

  return details.length
    ? details.join(" ")
    : "No pudimos subir este comprobante. Verifica los datos e inténtalo de nuevo.";
};

const isEmptyVoucherRow = (rowData: FormDataRow) => {
  const hasFiles = Boolean(rowData.XMLFile || rowData.PDFFile);
  const hasTextFields =
    Boolean(rowData.spentClass) ||
    Boolean(rowData.taxIndicator) ||
    Boolean(rowData.date);
  const hasAmount = Number(rowData.amount) > 0;

  return !hasFiles && !hasTextFields && !hasAmount;
};

export const Vouchers = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<FormDataRow[]>([]);
  const [trip, setTrip] = useState<Trip>({
    id: 0,
    title: "",
    advance_money: 0,
    destination: {
      city: "",
    },
  });
  const [commentValue, setCommentValue] = useState<string>("");

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await getRequest(`/requests/${id}`);
        setTrip(response);
      } catch (err) {
        console.error(
          "Error al cargar el viaje: ",
          err instanceof Error ? err.message : err
        );
      }
    };
    fetchTrip();
  }, []);

  const handleSubmitRefund = async () => {
    let currentStep: "upload" | "finish" = "upload";

    try {
      // comprobante_pendiente, comprobante_denegado, comprobante_aprobado
      let formDataToSend = null;
      const uploadResults: UploadResult[] = [];
      let attemptedUploads = 0;

      for (const [index, rowData] of formData.entries()) {
        if (isEmptyVoucherRow(rowData)) {
          continue;
        }

        attemptedUploads += 1;
        formDataToSend = new FormData();

        formDataToSend.append("id_request", trip.id.toString());
        //formDataToSend.append("comment", commentDescriptionOfSpend);
        formDataToSend.append("date", new Date().toISOString());
        formDataToSend.append("class", rowData.spentClass);
        formDataToSend.append("amount", rowData.amount.toString());
        formDataToSend.append("tax_type", rowData.taxIndicator);
        formDataToSend.append("status", "comprobante_pendiente");
        formDataToSend.append("currency", "MXN");
        formDataToSend.append("id_approver", "");
        if (rowData.XMLFile) {
          formDataToSend.append("file_url_xml", rowData.XMLFile);
        }

        if (rowData.PDFFile) {
          formDataToSend.append("file_url_pdf", rowData.PDFFile);
        }

        try {
          await postRequest("/vouchers/upload", formDataToSend);
          uploadResults.push({ rowNumber: index + 1, status: "success" });
        } catch (err) {
          const axiosError = err as AxiosError<UploadVoucherErrorResponse>;
          const statusCode = axiosError.response?.status;
          const technicalUploadMessage =
            statusCode === 400
              ? getUploadErrorMessage(axiosError.response?.data)
              : axiosError.response?.data?.message ||
                "Error al subir el comprobante.";
          const userUploadMessage =
            statusCode === 400
              ? getUploadUserMessage(axiosError.response?.data)
              : axiosError.response?.data?.message ||
                "No pudimos subir este comprobante. Inténtalo nuevamente.";

          uploadResults.push({
            rowNumber: index + 1,
            status: "failed",
            reason: userUploadMessage,
          });

          console.error("Voucher upload failed.", {
            requestId: id,
            rowNumber: index + 1,
            statusCode,
            response: axiosError.response?.data,
            technicalMessage: technicalUploadMessage,
          });
        }
      }

      const successfulUploads = uploadResults.filter(
        (result) => result.status === "success"
      ).length;
      const failedUploads: UploadFailureDetail[] = uploadResults
        .filter((result) => result.status === "failed")
        .reduce<UploadFailureDetail[]>((acc, result) => {
          const rowData = formData[result.rowNumber - 1];

          if (!rowData) {
            console.warn("Missing row data for failed upload result.", {
              requestId: id,
              rowNumber: result.rowNumber,
            });
            return acc;
          }

          acc.push({
            rowNumber: result.rowNumber,
            reason: result.reason || "Error al subir el comprobante.",
            rowData,
          });

          return acc;
        }, []);

      if (attemptedUploads === 0) {
        console.warn(
          "No voucher rows were attempted; skipping finish-uploading-vouchers step.",
          {
            requestId: id,
            rowsAttempted: 0,
            rowsInForm: formData.length,
            successfulUploads,
          }
        );
        toast.error("No se subió ningún comprobante válido.");
        return;
      }

      if (successfulUploads === 0) {
        const failedRows = failedUploads.map((failure) => failure.rowNumber);
        const firstFailureReason = failedUploads[0]?.reason;
        const rowLabel =
          failedRows.length === 1
            ? `la fila ${failedRows[0]}`
            : `las filas ${failedRows.join(", ")}`;

        console.warn(
          "All attempted voucher uploads failed; skipping finish-uploading-vouchers step.",
          {
            requestId: id,
            rowsAttempted: attemptedUploads,
            successfulUploads,
            failedUploads: failedUploads.length,
            failedRows,
          }
        );
        toast.error(
          `No pudimos subir ${failedUploads.length} comprobante(s) en ${rowLabel}. ${firstFailureReason}`
        );
        return;
      }

      if (failedUploads.length > 0) {
        const failedRows = failedUploads.map((failure) => failure.rowNumber);
        const firstFailureReason = failedUploads[0]?.reason;
        const rowLabel =
          failedRows.length === 1
            ? `fila ${failedRows[0]}`
            : `filas ${failedRows.join(", ")}`;

        console.warn(
          "Some vouchers failed to upload; skipping finish-uploading-vouchers step.",
          {
            requestId: id,
            rowsAttempted: attemptedUploads,
            successfulUploads,
            failedUploads: failedUploads.length,
            failedRows,
          }
        );

        toast.error(
          `Se subieron ${successfulUploads} comprobante(s), pero ${failedUploads.length} falló/fallaron (${rowLabel}). ${firstFailureReason}`
        );

        setFormData(failedUploads.map((failure) => failure.rowData));
        return;
      }

      currentStep = "finish";
      await patchRequest(`/requests/finished-uploading-vouchers/${id}`, {});

      toast.success("Solicitud de reembolso enviada con éxito.");
      setFormData([]);
      navigate("/refunds");
    } catch (err) {
      console.error(
        "Error al enviar la solicitud de reembolso: ",
        err instanceof Error ? err.message : err
      );

      const axiosError = err as AxiosError<UploadVoucherErrorResponse>;
      const statusCode = axiosError.response?.status;

      if (currentStep === "upload" && statusCode === 400) {
        console.error("Voucher upload rejected (400).", {
          requestId: id,
          statusCode,
          response: axiosError.response?.data,
        });
        toast.error(getUploadErrorMessage(axiosError.response?.data));
        return;
      }

      if (currentStep === "finish" && statusCode === 409) {
        const backendMessage = axiosError.response?.data?.message;
        console.error("Finish uploading vouchers rejected (409).", {
          requestId: id,
          statusCode,
          response: axiosError.response?.data,
        });
        toast.error(
          backendMessage ||
            "No hay comprobantes válidos cargados para finalizar la solicitud."
        );
        return;
      }

      toast.error(
        "Error al enviar la solicitud de reembolso. Por favor, inténtelo de nuevo más tarde."
      );
    }
  };
  const columnsSchemaVauchers = [
    {
      key: "spentClass",
      header: "Clase de gasto",
      defaultValue: "",
      /*
       * An fast example of how the renderCell function works:
       * 1. When change the option in the dropdown, the native OnChange function of the dropdown is called.
       * 2. OnChangeComponentFunction is acually the function passed as a prop to the renderCell function,
       *    in this case (newValue) => handleFieldChange(rowIndex, column.key, newValue) in the DynamicTable component.
       * 3. This function is used to update the component from child to parent, so it will update the value of the
       *   column in the row with the new value selected in the dropdown.
       *
       */
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number
      ) => (
        <Dropdown
          id={`spend_class-${_rowIndex}-${_cellIndex}`}
          options={spendOptions}
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          placeholder="Seleccione"
        />
      ),
    },
    {
      key: "amount",
      header: "Monto MXN",
      defaultValue: 0,
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number
      ) => (
        <InputField
          id={`amount-${_rowIndex}-${_cellIndex}`}
          type="number"
          value={value as string}
          onChange={(e) => onChangeComponentFunction(Number(e.target.value))}
          placeholder="Ingrese"
        />
      ),
    },
    {
      key: "taxIndicator",
      header: "Indicador de impuesto",
      defaultValue: "",
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number
      ) => (
        <Dropdown
          id={`tax_indicator-${_rowIndex}-${_cellIndex}`}
          options={taxIndicatorOptions}
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          placeholder="Seleccione"
        />
      ),
    },
    {
      key: "date",
      header: "Fecha del comprobante",
      defaultValue: "",
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number
      ) => (
        <InputField
          id={`date-${_rowIndex}-${_cellIndex}`}
          type="date"
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
        />
      ),
    },
    {
      key: "XMLFile",
      header: "Archivo XML",
      defaultValue: "",
      renderCell: (
        _value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        rowIndex?: number,
        _cellIndex?: number
      ) => (
        <InputField
          id={`xml_file-${rowIndex}-${_cellIndex}`}
          selectedFileName={formData[rowIndex || 0]?.XMLFile?.name || ""}
          type="file"
          accept=".xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChangeComponentFunction(file);
              if (rowIndex !== undefined) {
                const updatedFormData = [...formData];

                if (updatedFormData[rowIndex]) {
                  updatedFormData[rowIndex].XMLFile = file;
                  setFormData(updatedFormData);
                }
              }
            }
          }}
          placeholder="Subir archivo XML"
        />
      ),
    },
    {
      key: "PDFFile",
      header: "Archivo PDF",
      defaultValue: "",
      renderCell: (
        _value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        rowIndex?: number,
        _cellIndex?: number
      ) => (
        <InputField
          id={`pdf_file-${rowIndex}-${_cellIndex}`}
          selectedFileName={formData[rowIndex || 0]?.PDFFile?.name || ""}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChangeComponentFunction(file);

              if (rowIndex !== undefined) {
                const updatedFormData = [...formData];
                if (updatedFormData[rowIndex]) {
                  updatedFormData[rowIndex].PDFFile = file;
                  setFormData(updatedFormData);
                }
              }
            }
          }}
          placeholder="Subir archivo PDF"
        />
      ),
    },
  ];

  const handleFormDataChange = (newData: FormDataRow[]) => {
    setFormData(newData);
  };

  // Wrapper function to handle the type conversion
  const handleDynamicTableDataChange = (data: DynamicTableRow[]) => {
    // Convert DynamicTableRow[] to FormDataRow[]
    handleFormDataChange(data as FormDataRow[]);
  };

  return (
    <>
      <Tutorial page="vouchers">
        <GoBack />
        <div className="max-w-full p-6 bg-[#eaeced] rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-[#0a2c6d] mb-1">
            Formato de solicitud de reembolso
          </h2>
          <div className="mb-4">
            {/*
             * Display general information about the trip, such as ID, name, destination,
             */}
            <h3 className="text-lg font-bold text-[#0a2c6d] mb-2">
              Información del viaje
            </h3>
            <p>
              <strong>ID del viaje:</strong> {trip.id}
            </p>
            <p>
              <strong>Nombre del viaje:</strong> {trip.title}
            </p>
            <p>
              <strong>Destino:</strong> {trip.destination.city}
            </p>
            <p>
              <strong>Anticipo:</strong> {formatMoney(trip.advance_money)}
            </p>
          </div>
          {/*
           * which contains the schema of the table.
           * The table is created initially with initially empty data,
           * and the user can add new rows to the table.
           * The formData array is updated with the handleFormDataChange function,
           * which is passed as a prop to the DynamicTable component.
           * The handleFormDataChange function updates the formData state with the new data.
           */}
          <div id="vouchers">
            <DynamicTable
              columns={columnsSchemaVauchers}
              initialData={formData}
              onDataChange={handleDynamicTableDataChange}
            />
          </div>
          {/*
           * Display a field to add a comment to the refund request.
           * The comment is stored in the commentDescriptionOfSpend state,
           * and is updated with the setCommentDescriptionOfSpend function.
           */}
          <h3 className="text-lg font-bold text-[#0a2c6d] mt-4 mb-2">
            Comentario
          </h3>
          <InputField
            id="comment-refund"
            type="text"
            value={commentValue}
            placeholder="Ingrese un comentario"
            onChange={(e) => setCommentValue(e.target.value)}
          />
          <div className="mt-6 flex justify-between">
            <Link
              to="/refunds"
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors hover:cursor-pointer"
            >
              Cancelar
            </Link>
            <button
              id="submit-refund"
              className="px-4 py-2 bg-[#0a2c6d] text-white rounded-md hover:bg-[#0d3d94] transition-colors hover:cursor-pointer"
              onClick={() => {
                handleSubmitRefund();
              }}
            >
              Enviar Solicitud
            </button>
          </div>
        </div>
      </Tutorial>
    </>
  );
};
