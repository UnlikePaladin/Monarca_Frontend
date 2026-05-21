/*This RequestInfo component shows a detailed view of a specific travel request (based on the id in the URL) and provides different actions depending on the logged-in user’s permissions and the request’s current status. When it mounts, it fetches the request with GET /requests/{id}, flattens all destination reservations into a single list, and builds a UI-friendly data object with formatted fields (Spanish status label via renderStatus, formatted dates and money, approver full name, origin city, and a comma-separated list of destination cities). It also fetches available travel agencies from GET /travel-agencies to allow approvers to assign one to the request. The page renders read-only request metadata, a detailed per-destination section (city, arrival/departure, details, and chips for hotel/plane/stay days), optional previous revision comments, and carousel previews (Swiper) for uploaded reservations and vouchers using FilePreviewerReservation and FilePreviewer, including computed totals and balance against the advance. Actions are permission-gated: approvers can select an agency, add a comment, and then approve (PATCH /requests/approve/{id}), request changes (POST /revisions), or deny (PATCH /requests/deny/{id}); request creators can edit (only when status is “Changes Needed”) or cancel (PATCH /requests/cancel/{id}); accounting users can mark spending as registered (PATCH /requests/SOI-approve/{id}) or mark the trip completed for refunds (PATCH /requests/complete-request/{id}). The component also integrates the tutorial/page-visit tracking via useApp and wraps the whole view in the Tutorial flow.*/

import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { patchRequest, postRequest } from "../utils/apiService";
import GoBack from "../components/GoBack";
import formatMoney from "../utils/formatMoney";
import formatDate from "../utils/formatDate";
import { toast } from "react-toastify";
import { getRequest } from "../utils/apiService";
import { Permission, useAuth } from "../hooks/auth/authContext";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { Tutorial } from "../components/Tutorial";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import FilePreviewer from "../components/Refunds/FilePreviewer";
import FilePreviewerReservation from "../components/Refunds/FilePreviewerReservation";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useApp } from "../hooks/app/appContext";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";

const renderStatus = (status: string) => {
  switch (status) {
    case "Pending Review":
      return "En revisión";
    case "Denied":
      return "Denegado";
    case "Cancelled":
      return "Cancelado";
    case "Changes Needed":
      return "Cambios necesarios";
    case "Pending Reservations":
      return "Reservas pendientes";
    case "Pending Accounting Approval":
      return "Contabilidad pendiente";
    case "Pending Vouchers Approval":
      return "Comprobantes pendientes";
    case "In Progress":
      return "En progreso";
    case "Pending Refund Approval":
      return "Reembolso pendiente";
    case "Completed":
      return "Completado";
    default:
      return status;
  }
};

type ToastKind = "success" | "info" | "error";

/**
 * Shows a warning toast when the API response includes email delivery warnings.
 * Otherwise, shows the normal operation toast using the provided toast kind.
 *
 * @param response API response that may include emailWarnings.
 * @param successMessage Message shown when no email warning exists.
 * @param warningMessage Message shown when email delivery failed.
 * @param successKind Toast type used when the operation finishes without email warnings.
 */
const showEmailAwareToast = (
  response: unknown,
  successMessage: string,
  warningMessage: string,
  successKind: ToastKind = "success",
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

  toast[successKind](successMessage, {
    position: "top-right",
    autoClose: 3000,
  });
};

const RequestInfo: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { authState } = useAuth();
  const [data, setData] = useState<any>({});
  const [comment, setComment] = useState("");
  const [agencies, setAgencies] = useState<any[]>([]);
  const [selectedAgency, setSelectedAgency] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const prevRef = React.useRef(null);
  const nextRef = React.useRef(null);

  const [currentIndexRes, setCurrentIndexRes] = useState(0);
  const prevRefRes = React.useRef(null);
  const nextRefRes = React.useRef(null);

  const { handleVisitPage, tutorial } = useApp();
  const navigationSource = (location.state as { from?: string } | null)?.from;
  const isApprovalsEntry = navigationSource === "approvals";
  const isHistoryEntry = navigationSource === "history";

  // Single modal state drives all confirmation dialogs on this page.
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    warningNote?: string;
    confirmText: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    isDestructive: false,
    onConfirm: () => {},
  });

  /**
   * Opens the confirmation modal with the provided configuration.
   * @param config - Modal content and the callback to invoke on confirmation.
   */
  const openConfirm = (config: Omit<typeof confirmModal, "isOpen">) => {
    setConfirmModal({ ...config, isOpen: true });
  };

  /**
   * Closes the confirmation modal without executing any action.
   */
  const closeConfirm = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  /**
   * Fetches the main request data and the history of policy violations for auditing purposes.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getRequest(`/requests/${id}`);
        const reservations = response.requests_destinations
          .map((dest: any) => dest.reservations)
          .flat();
        console.log(response);
        setData({
          ...response,
          idTravelAgency: response.id_travel_agency,
          reservations: reservations,
          formatted_status: renderStatus(response.status),
          createdAt: formatDate(response.createdAt),
          advance_money_str: formatMoney(response.advance_money),
          admin: response.admin.name + " " + response.admin.lastName,
          id_origin_city: response.destination.city,
          destinations: [...response.requests_destinations]
            .sort((a: any, b: any) => a.destination_order - b.destination_order)
            .map((dest: any) => dest.destination.city)
            .join(", "),
        });
        setSelectedAgency(response.id_travel_agency || "");
      } catch (error) {
        console.error("Error fetching request data:", error);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    // Get the visited pages from localStorage
    const visitedPages = JSON.parse(
      localStorage.getItem("visitedPages") || "[]",
    );
    // Check if the current page is already in the visited pages
    const isPageVisited = visitedPages.includes(location.pathname);

    // If the page is not visited, set the tutorial to true
    if (!isPageVisited) {
      // setTutorial(true);
    }
    // Add the current page to the visited pages
    handleVisitPage();
  }, []);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await getRequest("/travel-agencies");
        setAgencies(response);
      } catch (error) {
        console.error("Error fetching agencies data:", error);
      }
    };

    fetchAgencies();
  }, []);

  const labels: { key: keyof typeof data; label: string }[] = [
    { key: "id", label: "ID solicitud" },
    { key: "admin", label: "Aprobador" },
    { key: "id_origin_city", label: "Ciudad de Origen" },
    { key: "destinations", label: "Destinos" },
    { key: "motive", label: "Motivo" },
    { key: "advance_money_str", label: "Anticipo" },
    { key: "formatted_status", label: "Estado" },
    { key: "requirements", label: "Requerimientos" },
    { key: "priority", label: "Prioridad" },
    { key: "createdAt", label: "Fecha de creación" },
  ];

  const approve = async () => {
    if (!selectedAgency) {
      toast.error("Selecciona una agencia de viaje", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await patchRequest(`/requests/approve/${id}`, {
        id_travel_agency: selectedAgency,
      });

      showEmailAwareToast(
        response,
        `Solicitud aprobada con ${selectedAgency}`,
        "Solicitud aprobada. Falló el envío de una o más notificaciones.",
      );

      setTimeout(() => {
        navigate("/approvals");
      }, 800);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Error al aprobar la solicitud", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const requestChanges = async () => {
    if (!comment.trim()) {
      toast.error("Escribe un comentario para solicitar cambios", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      const response = await postRequest(`/revisions`, {
        id_request: id,
        comment: comment,
      });

      showEmailAwareToast(
        response,
        "Se han solicitado cambios",
        "Cambios solicitados. No se pudo enviar la notificación por correo.",
        "info",
      );

      setTimeout(() => {
        navigate("/approvals");
      }, 800);
    } catch (error) {
      console.error("Error requesting changes:", error);
      toast.error("Error al solicitar cambios", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const deny = async () => {
    try {
      const response = await patchRequest(`/requests/deny/${id}`, {});

      showEmailAwareToast(
        response,
        "Solicitud denegada",
        "Solicitud denegada. No se pudo enviar la notificación por correo.",
        "error",
      );

      setTimeout(() => {
        navigate("/approvals");
      }, 800);
    } catch (error) {
      console.error("Error denying request:", error);
      toast.error("Error al denegar la solicitud", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const cancel = async () => {
    try {
      const response = await patchRequest(`/requests/cancel/${id}`, {});

      showEmailAwareToast(
        response,
        "Solicitud cancelada",
        "La solicitud fue cancelada, pero no se pudo enviar el correo de notificación. Puedes continuar con el proceso.",
        "error",
      );

      setTimeout(() => {
        navigate("/history");
      }, 800);
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Error al cancelar la solicitud", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const register = async () => {
    try {
      const response = await patchRequest(`/requests/SOI-approve/${id}`, {});

      showEmailAwareToast(
        response,
        "Contabilidad aprobada; la agencia puede reservar",
        "Contabilidad aprobada. Falló el envío de una o más notificaciones.",
      );

      setTimeout(() => {
        navigate("/history");
      }, 800);
    } catch (error) {
      console.error("Error registering request:", error);
      toast.error("Error al marcar la solicitud como registrada", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const complete = async () => {
    try {
      const response = await patchRequest(
        `/requests/complete-request/${id}`,
        {},
      );

      showEmailAwareToast(
        response,
        "Solicitud marcada como completada",
        "Solicitud completada. No se pudo enviar la notificación por correo.",
      );

      setTimeout(() => {
        navigate("/check-refunds");
      }, 800);
    } catch (error) {
      console.error("Error completing request:", error);
      toast.error("Error al marcar la solicitud como completada", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  };

  const approvedVouchersTotal = (data?.vouchers ?? []).reduce(
    (
      acc: number,
      file: { status: string; amount?: number; amount_mxn?: number },
    ) => {
      if (file.status !== "Voucher Approved") {
        return acc;
      }

      const rawAmount = file.amount_mxn ?? file.amount;
      const normalizedAmount = Number(rawAmount);
      return acc + (Number.isFinite(normalizedAmount) ? normalizedAmount : 0);
    },
    0,
  );

  return (
    <Tutorial page="requestInfo" run={tutorial}>
      <div className="pb-10">
        <GoBack />
        <main className="max-w-6xl mx-auto rounded-lg shadow-lg overflow-hidden">
          <div className="px-8 py-10 flex flex-col">
            <div className="w-fit bg-[var(--blue)] text-white px-4 py-2 rounded-full mb-6">
              Información de Solicitud: <span>{id}</span>
            </div>
            <p className="mb-6 text-gray-700 font-medium">
              Solicitante:{" "}
              <span className="text-[var(--blue)]">
                {data?.user?.name} {data?.user?.lastName}
              </span>
            </p>

            <section
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
              id="request-info"
            >
              {labels.map(({ key, label }) => (
                <div key={key as string}>
                  <label
                    htmlFor={key as string}
                    className="block text-xs font-semibold text-gray-500 mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={key as string}
                    type="text"
                    readOnly
                    value={String(data[key])}
                    className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                  />
                </div>
              ))}
            </section>

            <section id="destinations-info">
              <p className="block text-sm font-medium text-gray-700 mb-4">
                Detalles de los destinos
              </p>

              {(() => {
                const sortedDestinations = [
                  ...(data?.requests_destinations ?? []),
                ].sort(
                  (a: any, b: any) => a.destination_order - b.destination_order,
                );
                const originCity = data?.destination?.city ?? "";

                return (
                  <>
                    {sortedDestinations.map((dest: any, index: number) => {
                      const fromCity =
                        index === 0
                          ? originCity
                          : (sortedDestinations[index - 1].destination?.city ??
                            "");
                      const toCity = dest.destination?.city ?? "";

                      return (
                        <div
                          key={dest.id}
                          className="flex gap-4 mb-3 p-4 rounded-xl border border-gray-200 bg-gray-50"
                        >
                          {/* Step badge */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--blue)] text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Route: origin city → destination city */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-700">
                                {fromCity}
                              </span>
                              <span className="text-[var(--blue)]">✈</span>
                              <span className="font-semibold text-[var(--blue)]">
                                {toCity}
                              </span>
                            </div>

                            {/* Date range and stay duration */}
                            <p className="text-sm text-gray-500 mb-2">
                              {formatDate(dest.departure_date)}
                              {dest.arrival_date && (
                                <> &rarr; {formatDate(dest.arrival_date)}</>
                              )}
                              {dest.stay_days && (
                                <span className="ml-2 text-gray-400">
                                  • {dest.stay_days} días
                                </span>
                              )}
                            </p>

                            {/* Service chips and details */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {dest.is_hotel_required && (
                                <span
                                  id={`hotel-${index}`}
                                  className="text-xs bg-[var(--yellow)] rounded-full px-3 py-1"
                                >
                                  Hotel
                                </span>
                              )}
                              {dest.is_plane_required && (
                                <span
                                  id={`plane-${index}`}
                                  className="text-xs bg-[var(--blue)] text-white rounded-full px-3 py-1"
                                >
                                  Avión
                                </span>
                              )}
                              {dest.details && (
                                <span className="text-xs text-gray-500 italic">
                                  {dest.details}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Round-trip return leg */}
                    {data?.is_round_trip &&
                      sortedDestinations.length > 0 &&
                      (() => {
                        const lastDest =
                          sortedDestinations[sortedDestinations.length - 1];
                        const returnFromCity =
                          lastDest?.destination?.city ?? "";
                        const returnToCity = originCity;
                        const returnDate = formatDate(lastDest?.arrival_date);

                        return (
                          <div className="flex gap-4 mb-3 p-4 rounded-xl border border-[var(--green)] bg-green-50">
                            {/* Step badge */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--green)] text-white flex items-center justify-center text-sm font-bold">
                              {sortedDestinations.length + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Return route */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-gray-700">
                                  {returnFromCity}
                                </span>
                                <span className="text-[var(--green)]">✈</span>
                                <span className="font-semibold text-[var(--green)]">
                                  {returnToCity}
                                </span>
                              </div>

                              <p className="text-sm text-gray-500 mb-2">
                                {returnDate}
                              </p>

                              {/* Return leg chips */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-[var(--blue)] text-white rounded-full px-3 py-1">
                                  Avión
                                </span>
                                <span className="text-xs bg-[var(--green)] text-white rounded-full px-3 py-1">
                                  Regreso
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </>
                );
              })()}
            </section>

            {data?.revisions?.length > 0 && (
              <section id="revisions-info">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Revisiones anteriores
                </p>
                <div className="grid grid-cols-1 gap-2 mb-6">
                  {data?.revisions?.map((revision: any, index: number) => (
                    <div key={revision.id}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Comentario
                      </label>
                      <input
                        id={`revision-comment-${index}`}
                        type="text"
                        readOnly
                        value={revision.comment}
                        className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data?.reservations?.length > 0 && (
              <section id="vouchers-info">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Reservaciones de la solicitud
                </p>
                <div className="mb-4">
                  <div className="bg-white p-4 relative">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                      Reservaciones {currentIndexRes + 1} de{" "}
                      {data?.reservations?.length}
                    </h2>
                    {/* Display the existing PDF using an iframe */}
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={50}
                      slidesPerView={1}
                      pagination={{ clickable: true }}
                      onBeforeInit={(swiper: any) => {
                        if (typeof swiper.params.navigation !== "boolean") {
                          swiper.params.navigation.prevEl = prevRefRes.current;
                          swiper.params.navigation.nextEl = nextRefRes.current;
                        }
                      }}
                      onSlideChange={(swiper: any) =>
                        setCurrentIndexRes(swiper.activeIndex)
                      }
                    >
                      {data?.reservations?.map((file: any, index: number) => (
                        <SwiperSlide key={index}>
                          <FilePreviewerReservation
                            file={file}
                            fileIndex={index}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    <div className="flex space-x-4 absolute z-10 top-2 right-4 bg-white">
                      <button
                        ref={prevRefRes}
                        disabled={currentIndexRes === 0}
                        className={`px-4 py-2 rounded-md hover:cursor-pointer ${
                          currentIndexRes === 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--blue)] text-white hover:bg-[var(--light-blue)]"
                        }`}
                      >
                        Anterior
                      </button>
                      <button
                        disabled={
                          currentIndexRes ===
                          (data?.reservations?.length ?? 0) - 1
                        }
                        ref={nextRefRes}
                        className={`px-4 py-2 rounded-md hover:cursor-pointer ${
                          currentIndexRes ===
                          (data?.reservations?.length ?? 0) - 1
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--blue)] text-white hover:bg-[var(--light-blue)]"
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                  <section className="grid grid-cols-3 gap-5">
                    <div className="my-5">
                      <label
                        htmlFor={"total"}
                        className="block text-xs font-semibold text-gray-500 mb-1"
                      >
                        Total de Reservaciones
                      </label>
                      <input
                        id="total_vouchers"
                        type="text"
                        readOnly
                        value={formatMoney(
                          data?.reservations?.reduce(
                            (acc: number, file: { price: number }) => {
                              return acc + +file.price;
                            },
                            0,
                          ) ?? 0,
                        )}
                        className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                      />
                    </div>
                  </section>
                </div>
              </section>
            )}

            {data?.vouchers?.length > 0 && (
              <section id="vouchers-info">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobantes de la solicitud
                </p>
                <div className="mb-4">
                  <div className="bg-white p-4 relative">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                      Comprobante {currentIndex + 1} de {data?.vouchers?.length}
                    </h2>
                    {/* Display the existing PDF using an iframe */}
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={50}
                      slidesPerView={1}
                      pagination={{ clickable: true }}
                      onBeforeInit={(swiper: any) => {
                        if (typeof swiper.params.navigation !== "boolean") {
                          swiper.params.navigation.prevEl = prevRef.current;
                          swiper.params.navigation.nextEl = nextRef.current;
                        }
                      }}
                      onSlideChange={(swiper: any) =>
                        setCurrentIndex(swiper.activeIndex)
                      }
                    >
                      {data?.vouchers?.map((file: any, index: number) => (
                        <SwiperSlide key={index}>
                          <FilePreviewer file={file} fileIndex={index} />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    <div className="flex space-x-4 absolute z-10 top-2 right-4 bg-white">
                      <button
                        ref={prevRef}
                        disabled={currentIndex === 0}
                        className={`px-4 py-2 rounded-md hover:cursor-pointer ${
                          currentIndex === 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--blue)] text-white hover:bg-[var(--light-blue)]"
                        }`}
                      >
                        Anterior
                      </button>
                      <button
                        disabled={
                          currentIndex === (data?.vouchers?.length ?? 0) - 1
                        }
                        ref={nextRef}
                        className={`px-4 py-2 rounded-md hover:cursor-pointer ${
                          currentIndex === (data?.vouchers?.length ?? 0) - 1
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--blue)] text-white hover:bg-[var(--light-blue)]"
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                  <section className="grid grid-cols-3 gap-5">
                    <div className="my-5">
                      <label
                        htmlFor={"total"}
                        className="block text-xs font-semibold text-gray-500 mb-1"
                      >
                        Total de Comprobantes
                      </label>
                      <input
                        id="total_vouchers"
                        type="text"
                        readOnly
                        value={formatMoney(approvedVouchersTotal)}
                        className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                      />
                    </div>
                    <div className="my-5">
                      <label
                        htmlFor={"advance_money"}
                        className="block text-xs font-semibold text-gray-500 mb-1"
                      >
                        Anticipo
                      </label>
                      <input
                        id="advance_money"
                        type="text"
                        readOnly
                        value={formatMoney(Number(data?.advance_money) || 0)}
                        className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                      />
                    </div>
                    <div className="my-5">
                      <label
                        htmlFor={"total"}
                        className="block text-xs font-semibold text-gray-500 mb-1"
                      >
                        Saldo{" "}
                        {(typeof data?.advance_money === "number"
                          ? data.advance_money
                          : Number(data?.advance_money) || 0) -
                          approvedVouchersTotal <
                        0
                          ? "a favor"
                          : "en contra"}
                      </label>
                      <input
                        id="balance"
                        type="text"
                        readOnly
                        value={formatMoney(
                          Math.abs(
                            (typeof data?.advance_money === "number"
                              ? data.advance_money
                              : Number(data?.advance_money) || 0) -
                              approvedVouchersTotal,
                          ),
                        )}
                        className={`w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200
                      ${
                        (typeof data?.advance_money === "number"
                          ? data.advance_money
                          : Number(data?.advance_money) || 0) -
                          approvedVouchersTotal >
                        0
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                      />
                    </div>
                  </section>
                </div>
              </section>
            )}

            {authState.userPermissions.includes(
              "approve_request" as Permission,
            ) && (
              <section className="mb-10" id="travel-agency">
                <label
                  htmlFor="agency"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {data.status !== "Pending Review"
                    ? "Agencia de viaje"
                    : "Agencias de viaje"}
                </label>
                {data.status === "Pending Review" ? (
                  <select
                    id="agency"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedAgency}
                    disabled={data.status !== "Pending Review"}
                    onChange={(e) => setSelectedAgency(e.target.value)}
                  >
                    <option value="">-- Selecciona una agencia --</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={
                      agencies?.find(
                        (agency) => agency.id === data.idTravelAgency,
                      )?.name
                    }
                    className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                  />
                )}
              </section>
            )}

            {authState.userPermissions.includes(
              "approve_request" as Permission,
            ) &&
              data.status === "Pending Review" && (
                <section className="mb-8" id="comment-section">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Comentarios (cambios a solicitar)
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe los cambios que el solicitante debe realizar en la solicitud..."
                  />
                </section>
              )}

            {/* Botones de acción */}
            {authState.userPermissions.includes(
              "approve_request" as Permission,
            ) &&
              !isHistoryEntry && (
                <>
                  {data.status === "Pending Review" && (
                    <section className="mb-10">
                      <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Información importante
                      </h1>
                      <p className="text-sm text-gray-600">
                        - Para aprobar esta solicitud, debes seleccionar una
                        agencia de viaje.
                      </p>
                      <p className="text-sm text-gray-600">
                        - Si la solicitud requiere cambios, descríbelos en
                        Comentarios (cambios a solicitar) y usa el botón
                        Solicitar cambios.
                      </p>
                      <p className="text-sm text-gray-600">
                        - Si deseas denegar la solicitud, puedes hacerlo
                        directamente.
                      </p>
                    </section>
                  )}
                  <footer className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() =>
                        openConfirm({
                          title: "Aprobar solicitud de viaje",
                          description:
                            "Estás a punto de aprobar esta solicitud. La agencia de viaje seleccionada recibirá la confirmación y procederá con las reservaciones.",
                          warningNote:
                            "Esta acción es irreversible. No podrás revertir la aprobación una vez confirmada.",
                          confirmText: "Sí, aprobar",
                          isDestructive: false,
                          onConfirm: approve,
                        })
                      }
                      disabled={
                        !selectedAgency || data.status !== "Pending Review"
                      }
                      className={`flex-1 py-3 rounded-lg font-semibold transition ${
                        !selectedAgency || data.status !== "Pending Review"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      id="approve-request-button"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() =>
                        openConfirm({
                          title: "Solicitar cambios al viajero",
                          description:
                            "Se pausará el proceso de aprobación y el viajero recibirá una notificación con tu comentario para que realice los ajustes necesarios.",
                          confirmText: "Sí, solicitar cambios",
                          isDestructive: false,
                          onConfirm: requestChanges,
                        })
                      }
                      disabled={
                        !comment.trim() || data.status !== "Pending Review"
                      }
                      className={`flex-1 py-3 rounded-lg font-semibold transition
                    ${
                      comment.trim() && data.status === "Pending Review"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                      id="changes-request-button"
                    >
                      Solicitar cambios
                    </button>
                    <button
                      onClick={() =>
                        openConfirm({
                          title: "Denegar solicitud de viaje",
                          description:
                            "Estás a punto de denegar esta solicitud. El solicitante será notificado y deberá iniciar una nueva solicitud si desea continuar.",
                          warningNote:
                            "Esta acción es irreversible. Una vez denegada, no podrás revertirla.",
                          confirmText: "Sí, denegar",
                          isDestructive: true,
                          onConfirm: deny,
                        })
                      }
                      disabled={data.status !== "Pending Review"}
                      className={`flex-1 py-3 rounded-lg font-semibold transition
                    ${
                      data.status === "Pending Review"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                      id="deny-request-button"
                    >
                      Denegar
                    </button>
                  </footer>
                </>
              )}

            {authState.userPermissions.includes(
              "create_request" as Permission,
            ) &&
              !isApprovalsEntry &&
              authState.userId === (data.id_user ?? data.user?.id) && (
                <footer className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate(`/requests/${id}/edit`)}
                    disabled={data.status !== "Changes Needed"}
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
                      data.status === "Changes Needed"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    id="edit-request-button"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      openConfirm({
                        title: "Cancelar solicitud de viaje",
                        description:
                          "Estás a punto de cancelar tu solicitud de viaje. Se notificará al aprobador y se detendrá el proceso.",
                        warningNote:
                          "Esta acción es irreversible. No podrás reactivar esta solicitud.",
                        confirmText: "Sí, cancelar solicitud",
                        isDestructive: true,
                        onConfirm: cancel,
                      })
                    }
                    disabled={
                      data.status !== "Pending Review" &&
                      data.status !== "Changes Needed"
                    }
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
                      data.status !== "Pending Review" &&
                      data.status !== "Changes Needed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                    id="cancel-request-button"
                  >
                    Cancelar
                  </button>
                </footer>
              )}

            {authState.userPermissions.includes(
              "check_budgets" as Permission,
            ) &&
              data.status === "Pending Accounting Approval" && (
                <footer className="flex flex-col sm:flex-row gap-4">
                  <button
                    id="register-spend"
                    onClick={() =>
                      openConfirm({
                        title: "Marcar gasto como registrado",
                        description:
                          "Confirmas que el anticipo de esta solicitud ha sido registrado correctamente en el sistema contable. Se habilitará la siguiente etapa del proceso para el viajero.",
                        warningNote: "Esta acción es irreversible.",
                        confirmText: "Sí, marcar como registrado",
                        isDestructive: false,
                        onConfirm: register,
                      })
                    }
                    disabled={data.status !== "Pending Accounting Approval"}
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
                      data.status === "Pending Accounting Approval"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Aprobar
                  </button>
                </footer>
              )}

            {authState.userPermissions.includes(
              "check_budgets" as Permission,
            ) &&
              data.status === "Pending Refund Approval" && (
                <footer className="flex flex-col sm:flex-row gap-4">
                  <button
                    id="complete-refund-request"
                    onClick={() =>
                      openConfirm({
                        title: "Marcar viaje como completado",
                        description:
                          "Confirmas que el viaje ha concluido. Esto habilitará al viajero para cargar sus comprobantes de gasto e iniciar el proceso de reembolso.",
                        warningNote: "Esta acción es irreversible.",
                        confirmText: "Sí, marcar como completado",
                        isDestructive: false,
                        onConfirm: complete,
                      })
                    }
                    disabled={data.status !== "Pending Refund Approval"}
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
                      data.status === "Pending Refund Approval"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Marcar viaje como completado
                  </button>
                </footer>
              )}
          </div>
        </main>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={() => {
          closeConfirm();
          confirmModal.onConfirm();
        }}
        title={confirmModal.title}
        description={confirmModal.description}
        warningNote={confirmModal.warningNote}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </Tutorial>
  );
};

export default RequestInfo;

/*
Modification History:
- 2026-04-11 | Fabrizio | Added policy violations audit section to provide transparency for the approver role.
- 2026-04-18 | Juan de Dios Gastélum | Added confirmation modals for all irreversible actions (approve, deny, cancel, register, complete).
- 2026-04-23 | Juan de Dios Gastélum | Fixed destination sort order and added return leg row for round trips.
- 2026-04-29 | Juan de Dios Gastélum | Added email warning toast handling for request status actions.
- 2026-05-20 | Juan de Dios Gastélum | Redesigned destinations section as trip-leg cards showing origin-to-destination route, date range, and tags.
*/
