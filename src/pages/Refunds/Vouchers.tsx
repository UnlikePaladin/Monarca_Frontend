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
import { PolicyAlert } from "../../components/Refunds/PolicyAlert";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useExchangeRate } from "../../hooks/exchange-rate/useExchangeRate";

interface FormDataRow extends DynamicTableRow {
  spentClass: string;
  amount: number;
  currency?: string;
  taxIndicator: string;
  date: string;
  isForeign?: boolean;
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
  policy_summary?: any;
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

interface PolicyViolation {
  policy_code: string;
  message: string;
  severity: "BLOCKING" | "WARNING";
  evaluated_value?: any;
  voucher_id?: string;
}

interface PolicySummary {
  total_rules?: number;
  passed?: number;
  failed?: number;
  blocking_violations?: number;
  can_submit?: boolean;
  violations?: PolicyViolation[];
}

interface PolicyPreviewResponse {
  policy_summary?: PolicySummary;
}

const currencyOptions = ["MXN", "USD", "EUR", "JPY", "CNY"];

const AmountMxnNote = ({
  amount,
  currency,
  date,
}: {
  amount: number;
  currency: string;
  date?: string;
}) => {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  if (normalizedAmount <= 0) {
    return null;
  }
  const today = new Date().toISOString().split("T")[0] ?? "";
  const effectiveDate = date || today;
  const shouldFetchRate = currency !== "MXN" && Boolean(effectiveDate);
  const rateQuery = useExchangeRate(effectiveDate, currency, shouldFetchRate);

  if (currency === "MXN") {
    return null;
  }

  if (rateQuery.isLoading) {
    return (
      <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-max -translate-x-1/2 rounded-md bg-[#0a2c6d] px-2 py-1 text-[11px] text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        Consultando tipo de cambio...
      </div>
    );
  }

  const rateValue = Number(rateQuery.data?.rate);
  if (rateQuery.isError || !Number.isFinite(rateValue)) {
    return (
      <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-max -translate-x-1/2 rounded-md bg-[#0a2c6d] px-2 py-1 text-[11px] text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        No se pudo obtener el tipo de cambio.
      </div>
    );
  }

  const mxnValue = Number((normalizedAmount * rateValue).toFixed(2));
  return (
    <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-max -translate-x-1/2 rounded-md bg-[#0a2c6d] px-2 py-1 text-[11px] text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      Equivalente en MXN: {formatMoney(mxnValue)}.
    </div>
  );
};

/**
 * Shows a warning toast when the API response includes email delivery warnings.
 * Otherwise, shows the normal success toast for the completed operation.
 *
 * @param response API response that may include emailWarnings.
 * @param successMessage Message shown when no email warning exists.
 * @param warningMessage Message shown when email delivery failed.
 */
const showEmailAwareToast = (
  response: unknown,
  successMessage: string,
  warningMessage: string,
) => {
  const responseData = response as { emailWarnings?: unknown };
  const emailWarnings = Array.isArray(responseData.emailWarnings)
    ? responseData.emailWarnings
    : [];

  if (emailWarnings.length > 0) {
    toast.warning(warningMessage, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    return;
  }

  toast.success(successMessage);
};

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
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewingPolicy, setIsPreviewingPolicy] = useState(false);
  const [needsWarningConfirmation, setNeedsWarningConfirmation] =
    useState(false);
  const [hasPreviewedPolicy, setHasPreviewedPolicy] = useState(false);
  // Controls the confirmation modal shown before submitting all vouchers.
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await getRequest(`/requests/${id}`);
        setTrip(response);
      } catch (err) {
        console.error(
          "Error al cargar el viaje: ",
          err instanceof Error ? err.message : err,
        );
      }
    };
    fetchTrip();
  }, [id]);

  /**
   * Processes each row of the table, uploads files to the server and handles policy engine rejections.
   * If a 422 error occurs, it extracts policy violations to display them to the requester.
   */

  const runPolicyPreview = async () => {
    if (!id) {
      return { hasWarnings: false, hasBlocking: false };
    }

    const vouchersPayload: Array<{
      class: string;
      amount: number;
      amount_mxn: number;
      currency: string;
      date: string;
      has_xml: boolean;
      has_pdf: boolean;
      is_foreign: boolean;
    }> = [];
    const voucherRowNumbers: number[] = [];

    const exchangeRateCache = new Map<string, number>();
    const resolveAmountMxnForPreview = async (rowData: FormDataRow) => {
      const amountValue = Number(rowData.amount);
      if (!Number.isFinite(amountValue)) {
        return null;
      }

      const currency = rowData.currency || "MXN";
      if (currency === "MXN") {
        return amountValue;
      }

      const dateValue = rowData.date || new Date().toISOString().split("T")[0];
      const cacheKey = `${dateValue}-${currency}`;
      const cachedRate = exchangeRateCache.get(cacheKey);

      if (cachedRate) {
        return Number((amountValue * cachedRate).toFixed(2));
      }

      const response = (await getRequest("/exchange-rates", {
        date: dateValue,
        currency,
      })) as { rate?: number };

      const rateValue = Number(response?.rate);
      if (!Number.isFinite(rateValue)) {
        return null;
      }

      exchangeRateCache.set(cacheKey, rateValue);
      return Number((amountValue * rateValue).toFixed(2));
    };

    for (const [index, row] of formData.entries()) {
      if (isEmptyVoucherRow(row)) {
        continue;
      }

      const amountValue = Number(row.amount);
      const normalizedAmount = Number.isFinite(amountValue) ? amountValue : 0;
      const amountMxn = await resolveAmountMxnForPreview(row);

      vouchersPayload.push({
        class: row.spentClass,
        amount: normalizedAmount,
        amount_mxn:
          amountMxn ?? (Number.isFinite(normalizedAmount) ? normalizedAmount : 0),
        currency: row.currency || "MXN",
        date: row.date,
        has_xml: Boolean(row.XMLFile),
        has_pdf: Boolean(row.PDFFile),
        is_foreign: row.isForeign === true || row.isForeign === "true",
      });
      voucherRowNumbers.push(index + 1);
    }

    if (vouchersPayload.length === 0) {
      setPolicyViolations([]);
      return { hasWarnings: false, hasBlocking: false };
    }

    setIsPreviewingPolicy(true);

    try {
      const response = (await postRequest(
        `/requests/${id}/vouchers-policy-preview`,
        { vouchers: vouchersPayload },
      )) as PolicyPreviewResponse;

      const summary = response.policy_summary;
      const violations = Array.isArray(summary?.violations)
        ? summary?.violations
        : [];

      const normalizedViolations: PolicyViolation[] = [];

      const addRowPrefix = (violation: PolicyViolation, voucherId?: string) => {
        if (!voucherId || !voucherId.startsWith("preview-")) {
          normalizedViolations.push(violation);
          return;
        }

        const indexValue = Number(voucherId.replace("preview-", ""));
        if (!Number.isFinite(indexValue) || indexValue < 1) {
          normalizedViolations.push(violation);
          return;
        }

        const rowNumber = voucherRowNumbers[indexValue - 1];
        if (!rowNumber) {
          normalizedViolations.push(violation);
          return;
        }

        normalizedViolations.push({
          ...violation,
          message: `[Fila ${rowNumber}] ${violation.message}`,
        });
      };

      violations.forEach((violation) => {
        const outOfWindowIds = violation.evaluated_value
          ?.out_of_window_voucher_ids as string[] | undefined;

        if (outOfWindowIds && outOfWindowIds.length > 0) {
          outOfWindowIds.forEach((voucherId) => {
            addRowPrefix({ ...violation, voucher_id: voucherId }, voucherId);
          });
          return;
        }

        addRowPrefix(violation, violation.voucher_id);
      });

      setPolicyViolations(normalizedViolations);

      return {
        hasWarnings: normalizedViolations.some(
          (violation: PolicyViolation) => violation.severity === "WARNING",
        ),
        hasBlocking: normalizedViolations.some(
          (violation: PolicyViolation) => violation.severity === "BLOCKING",
        ),
      };
    } catch (err) {
      console.error("Error al prevalidar comprobantes:", err);
      toast.error(
        "No pudimos validar las políticas del reembolso. Inténtalo nuevamente.",
      );
      return { hasWarnings: false, hasBlocking: false };
    } finally {
      setIsPreviewingPolicy(false);
    }
  };

  const handleSubmitClick = async () => {
    if (isSubmitting || isPreviewingPolicy) {
      return;
    }

    if (needsWarningConfirmation) {
      setShowSubmitModal(true);
      return;
    }

    setHasPreviewedPolicy(true);
    const previewResult = await runPolicyPreview();

    if (previewResult.hasBlocking) {
      toast.error("Existen comprobantes que no cumplen con las políticas.");
      return;
    }

    if (previewResult.hasWarnings) {
      setNeedsWarningConfirmation(true);
      toast.warning(
        "Hay advertencias en la validación. Puedes enviar de todos modos.",
      );
      return;
    }

    setShowSubmitModal(true);
  };

  const handleSubmitRefund = async () => {
    let currentStep: "upload" | "finish" = "upload";
    setPolicyViolations([]);
    setIsSubmitting(true);

    const exchangeRateCache = new Map<string, number>();

    const resolveAmountMxn = async (rowData: FormDataRow) => {
      const amountValue = Number(rowData.amount);
      if (!Number.isFinite(amountValue)) {
        return null;
      }

      const currency = rowData.currency || "MXN";
      if (currency === "MXN") {
        return amountValue;
      }

      const dateValue = rowData.date || new Date().toISOString().split("T")[0];
      const cacheKey = `${dateValue}-${currency}`;
      const cachedRate = exchangeRateCache.get(cacheKey);

      if (cachedRate) {
        return Number((amountValue * cachedRate).toFixed(2));
      }

      const response = (await getRequest("/exchange-rates", {
        date: dateValue,
        currency,
      })) as { rate?: number };

      const rateValue = Number(response?.rate);
      if (!Number.isFinite(rateValue)) {
        return null;
      }

      exchangeRateCache.set(cacheKey, rateValue);
      return Number((amountValue * rateValue).toFixed(2));
    };

    try {
      // comprobante_pendiente, comprobante_denegado, comprobante_aprobado
      let formDataToSend = null;
      const uploadResults: UploadResult[] = [];
      let attemptedUploads = 0;

      for (const [index, rowData] of formData.entries()) {
        if (isEmptyVoucherRow(rowData)) {
          continue;
        }

        const isForeign =
          rowData.isForeign === true || rowData.isForeign === "true";

        if (!rowData.date) {
          toast.error(`La fila ${index + 1} no tiene una fecha seleccionada.`);
          setIsSubmitting(false);
          return;
        }

        const amountValue = Number(rowData.amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
          toast.error(
            `La fila ${index + 1} requiere un monto valido mayor a 0.`,
          );
          setIsSubmitting(false);
          return;
        }

        if (!isForeign && !rowData.XMLFile) {
          toast.error(
            `La fila ${index + 1} requiere XML cuando el comprobante no es extranjero.`,
          );
          setIsSubmitting(false);
          return;
        }

        attemptedUploads += 1;
        formDataToSend = new FormData();

        const amountMxn = await resolveAmountMxn(rowData);
        if (amountMxn === null) {
          toast.error(
            `No se pudo calcular el monto en MXN para la fila ${index + 1}.`,
          );
          setIsSubmitting(false);
          return;
        }

        formDataToSend.append("id_request", trip.id.toString());
        //formDataToSend.append("comment", commentDescriptionOfSpend);
        formDataToSend.append("date", rowData.date);
        formDataToSend.append("class", rowData.spentClass);
        formDataToSend.append("amount", amountValue.toString());
        formDataToSend.append("tax_type", rowData.taxIndicator);
        formDataToSend.append("status", "comprobante_pendiente");
        formDataToSend.append("currency", rowData.currency || "MXN");
        formDataToSend.append("amount_mxn", amountMxn.toString());
        formDataToSend.append("id_approver", "");
        formDataToSend.append("is_foreign", isForeign ? "true" : "false");
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

          if (statusCode === 422 && axiosError.response?.data?.policy_summary) {
            const violations =
              axiosError.response.data.policy_summary.violations;
            setPolicyViolations((prev) => [...prev, ...violations]);
          }

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
        (result) => result.status === "success",
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
          },
        );
        toast.error("No se subió ningún comprobante válido.");
        setIsSubmitting(false);
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
          },
        );
        toast.error(
          `No pudimos subir ${failedUploads.length} comprobante(s) en ${rowLabel}. ${firstFailureReason}`,
        );
        setIsSubmitting(false);
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
          },
        );

        toast.error(
          `Se subieron ${successfulUploads} comprobante(s), pero ${failedUploads.length} falló/fallaron (${rowLabel}). ${firstFailureReason}`,
        );

        setFormData(failedUploads.map((failure) => failure.rowData));
        setIsSubmitting(false);
        return;
      }

      currentStep = "finish";
      const response = await patchRequest(
        `/requests/finished-uploading-vouchers/${id}`,
        {},
      );

      showEmailAwareToast(
        response,
        "Solicitud de reembolso enviada con éxito.",
        "Reembolso enviado. No se pudo enviar la notificación por correo.",
      );

      setFormData([]);

      setTimeout(() => {
        navigate("/refunds");
      }, 800);
    } catch (err) {
      console.error(
        "Error al enviar la solicitud de reembolso: ",
        err instanceof Error ? err.message : err,
      );

      const axiosError = err as AxiosError<UploadVoucherErrorResponse>;
      const statusCode = axiosError.response?.status;

      if (statusCode === 422 && axiosError.response?.data?.policy_summary) {
        setPolicyViolations(axiosError.response.data.policy_summary.violations);
        toast.error("La solicitud excede los límites de anticipo o tiempo.");
        return;
      }

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
            "No hay comprobantes válidos cargados para finalizar la solicitud.",
        );
        return;
      }

      toast.error(
        "Error al enviar la solicitud de reembolso. Por favor, inténtelo de nuevo más tarde.",
      );
    } finally {
      setIsSubmitting(false);
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
        _cellIndex?: number,
      ) => (
        <Dropdown
          id={`spend_class-${_rowIndex}-${_cellIndex}`}
          options={spendOptions}
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          placeholder="Seleccione"
          wrapperClassName="relative flex flex-col mb-1"
        />
      ),
    },
    {
      key: "amount",
      header: "Monto",
      defaultValue: 0,
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number,
      ) => (
        <div className="group relative flex flex-col items-center gap-1">
          <InputField
            id={`amount-${_rowIndex}-${_cellIndex}`}
            type="number"
            value={value as string}
            onChange={(e) => onChangeComponentFunction(Number(e.target.value))}
            placeholder="Ingrese"
            className="w-28 text-center py-1.5"
            wrapperClassName="flex flex-col mb-1"
            onWheel={(e) => e.currentTarget.blur()}
          />
          <AmountMxnNote
            amount={Number(value)}
            currency={formData[_rowIndex || 0]?.currency || "MXN"}
            date={formData[_rowIndex || 0]?.date}
          />
        </div>
      ),
    },
    {
      key: "currency",
      header: "Moneda",
      defaultValue: "MXN",
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        _rowIndex?: number,
        _cellIndex?: number,
      ) => (
        <Dropdown
          id={`currency-${_rowIndex}-${_cellIndex}`}
          options={currencyOptions.map((currency) => ({
            value: currency,
            label: currency,
          }))}
          value={(value as string) || "MXN"}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          placeholder="Seleccione"
          className="p-2 border border-gray-300 rounded-md w-24 text-center focus:outline-none focus:ring-2 text-[#0a2c6d] focus:ring-blue-500 bg-white hover:cursor-pointer"
          wrapperClassName="relative flex flex-col mb-1"
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
        _cellIndex?: number,
      ) => (
        <Dropdown
          id={`tax_indicator-${_rowIndex}-${_cellIndex}`}
          options={taxIndicatorOptions}
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          placeholder="Seleccione"
          wrapperClassName="relative flex flex-col mb-1"
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
        _cellIndex?: number,
      ) => (
        <InputField
          id={`date-${_rowIndex}-${_cellIndex}`}
          type="date"
          value={value as string}
          onChange={(e) => onChangeComponentFunction(e.target.value)}
          className="py-1.5"
          wrapperClassName="flex flex-col mb-1"
        />
      ),
    },
    {
      key: "isForeign",
      header: "Comprobante extranjero",
      defaultValue: false,
      renderCell: (
        value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        rowIndex?: number,
        _cellIndex?: number,
      ) => {
        const isChecked =
          value === true ||
          value === "true" ||
          value === 1 ||
          value === "1";

        return (
          <div className="flex items-center justify-center">
            <InputField
              id={`is_foreign-${rowIndex}-${_cellIndex}`}
              type="checkbox"
              value={isChecked ? "true" : "false"}
              onChange={(e) => onChangeComponentFunction(e.target.checked)}
              wrapperClassName="flex flex-col mb-0"
            />
          </div>
        );
      },
    },
    {
      key: "XMLFile",
      header: "Archivo XML",
      defaultValue: "",
      renderCell: (
        _value: CellValueType,
        onChangeComponentFunction: (newValue: CellValueType) => void,
        rowIndex?: number,
        _cellIndex?: number,
        patchRow?: (fields: Partial<FormDataRow>) => void
      ) => (
        <InputField
          id={`xml_file-${rowIndex}-${_cellIndex}`}
          selectedFileName={formData[rowIndex || 0]?.XMLFile?.name || ""}
          type="file"
          accept=".xml"
          className="py-1.5"
          wrapperClassName="flex flex-col mb-1"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || rowIndex === undefined) {
              return;
            }
            onChangeComponentFunction(file);

            const isForeign =
              formData[rowIndex]?.isForeign === true ||
              formData[rowIndex]?.isForeign === "true";

            if (isForeign) {
              return;
            }

            if (!patchRow) {
              return;
            }

            const fd = new FormData();
            fd.append("file", file);

            try {
              const res = (await postRequest("/cfdi/preview", fd)) as {
                total: number | null;
                fecha: string | null;
                taxIndicator: string | null;
              };

              const partial: Partial<FormDataRow> = {};
              if (res.total != null && !Number.isNaN(Number(res.total))) {
                partial.amount = Number(res.total);
              }
              if (res.fecha) {
                partial.date = res.fecha;
              }
              if (res.taxIndicator) {
                partial.taxIndicator = res.taxIndicator;
              }
              patchRow(partial);
            } catch (err) {
              console.error("CFDI preview:", err);
              toast.error(
                "No se pudieron leer el total, la fecha o el indicador de impuesto del XML.",
              );
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
        _cellIndex?: number,
      ) => (
        <InputField
          id={`pdf_file-${rowIndex}-${_cellIndex}`}
          selectedFileName={formData[rowIndex || 0]?.PDFFile?.name || ""}
          type="file"
          accept=".pdf"
          className="py-1.5"
          wrapperClassName="flex flex-col mb-1"
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
    setNeedsWarningConfirmation(false);
    if (hasPreviewedPolicy) {
      setPolicyViolations([]);
    }
  };

  useEffect(() => {
    if (!hasPreviewedPolicy) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isSubmitting) {
        runPolicyPreview();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, hasPreviewedPolicy, isSubmitting]);

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
              showRowNumbers
              allowDelete
            />
          </div>
          {/*
           * Display a field to add a comment to the refund request.
           * The comment is stored in the commentDescriptionOfSpend state,
           * and is updated with the setCommentDescriptionOfSpend function.
           */}
          <PolicyAlert violations={policyViolations} />
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
              disabled={isSubmitting || isPreviewingPolicy}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                isSubmitting || isPreviewingPolicy
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0a2c6d] hover:bg-[#0d3d94] hover:cursor-pointer"
              }`}
              onClick={handleSubmitClick}
            >
              {isSubmitting
                ? "Procesando..."
                : needsWarningConfirmation
                  ? "Enviar de todos modos"
                  : "Enviar Solicitud"}
            </button>
          </div>
        </div>
      </Tutorial>
      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => {
          setShowSubmitModal(false);
          handleSubmitRefund();
        }}
        title="Enviar comprobantes de gasto"
        description="Estás a punto de enviar todos los comprobantes listados para revisión contable. Asegúrate de que los archivos XML/PDF y montos sean correctos antes de continuar."
        warningNote="Una vez enviados, no podrás modificar ni eliminar los comprobantes. El equipo de contabilidad revisará cada uno individualmente."
        confirmText="Sí, enviar comprobantes"
        isDestructive={false}
      />
    </>
  );
};

/*
Modification History:
- 2026-04-11 | Fabrizio | Integrated policy engine validation (422 error handling) and trip window date synchronization.
- 2026-04-18 | Juan de Dios Gastélum Flores | Added confirmation modal before voucher submission to prevent accidental sends.
- 2026-04-29 | Juan de Dios Gastélum Flores | Added email warning toast handling after submitting vouchers.
- 2026-04-29 | Fabrizio Barrios Blanco | Added floating helper text for MXN amount input.
*/
