import { driver } from "driver.js";
import { useEffect } from "react";
import { useApp } from "../hooks/app/appContext";

const dashboardSteps = [
  {
    element: "#create-request",
    popover: {
      title: "Crear solicitud de viaje",
      description: "En esta sección, puedes crear una solicitud de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#history",
    popover: {
      title: "Historial de viajes",
      description: "Aquí puedes consultar tu historial de solicitudes de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#upload_vouchers",
    popover: {
      title: "Comprobar Gastos",
      description: " Carga los archivos que contienen tus facturas del viaje.",
      position: "bottom",
    },
  },
  {
    element: "#approve_request",
    popover: {
      title: "Viajes por aprobar",
      description: "En esta sección puedes aprobar las solicitudes de viaje que envían los solicitantes.",
      position: "bottom",
    },
  },
  {
    element: "#approved_requests",
    popover: {
      title: "Historial de viajes aprobados",
      description: "Consulta todas las aprobaciones de viajes que has realizado.",
      position: "bottom",
    },
  },
  {
    element: "#approve_vouchers",
    popover: {
      title: "Comprobantes de gastos por aprobar",
      description: "Aquí puedes aprobar las facturas que han cargado los viajeros.",
      position: "bottom",
    },
  },
  {
    element: "#check_budgets",
    popover: {
      title: "Viajes por registrar",
      description: "Registra los anticipos de cada viaje.",
      position: "bottom",
    },
  },
  {
    element: "#check_refunds",
    popover: {
      title: "Reembolsos por registrar",
      description: "Registra los reembolsos de cada viaje.",
      position: "bottom",
    },
  },
  {
    element: "#bookings",
    popover: {
      title: "Viajes por reservar",
      description: "Aquí puedes reservar los viajes para cada solicitud",
      position: "bottom",
    },
  },
  {
    element: "#reserved_requests",
    popover: {
      title: "Historial de viajes reservados",
      description: "Monitorea cada uno de los viajes que has reservado",
      position: "bottom",
    },
  },
];

const createRequestSteps = [
  {
    element: "#travel_request_info",
    popover: {
      title: "Datos Generales del Viaje",
      description: "",
      position: "bottom",
    },
  },
  {
    element: "#destination_info",
    popover: {
      title: "Información del Destino",
      description: "",
      position: "bottom",
    },
  },
  {
    element: "#new_destination",
    popover: {
      title: "Agrega más destinos",
      description: "",
      position: "bottom",
    },
  },
   {
    element: "#create_travel_request",
    popover: {
      title: "Crear Viaje",
      description: "",
      position: "bottom",
    },
}
]

const createCompanySteps = [
  {
    element: "#tenant_info",
    popover: {
      title: "Datos de la Empresa",
      description: "Un Super Administrador registra una empresa con su Clave y Nombre.",
      position: "bottom",
    },
  },
  {
    element: "#tenant_currency",
    popover: {
      title: "Moneda Local",
      description: "Selecciona la moneda local (localCurrency).",
      position: "bottom",
    },
  },
  {
    element: "#tenant_company",
    popover: {
      title: "Empresa Seleccionada",
      description: "Un Administrador de Empresa crea departamentos sobre la empresa activa.",
      position: "bottom",
    },
  },
  {
    element: "#tenant_departments",
    popover: {
      title: "Departamentos",
      description: "Crea el departamento con su nombre y centro de costos.",
      position: "bottom",
    },
  },
  {
    element: "#tenant_admin",
    popover: {
      title: "Administrador por Defecto",
      description:
        "La empresa se crea junto con su CompanyAdmin inicial. Define su nombre, apellido, correo y contraseña aquí.",
      position: "bottom",
    },
  },
  {
    element: "#create_tenant",
    popover: {
      title: "Crear Empresa",
      description: "Cuando termines, guarda la empresa y su administrador por defecto con este botón.",
      position: "bottom",
    },
  },
]

const createDepartmentSteps = [
  {
    element: "#tenant_company",
    popover: {
      title: "Empresa Seleccionada",
      description: "Un Administrador de Empresa crea departamentos sobre la empresa activa.",
      position: "bottom",
    },
  },
  {
    element: "#tenant_departments",
    popover: {
      title: "Departamentos",
      description: "Crea el departamento con su nombre y centro de costos.",
      position: "bottom",
    },
  },
  {
    element: "#create_department",
    popover: {
      title: "Crear Departamento",
      description: "Guarda el departamento en la empresa seleccionada.",
      position: "bottom",
    },
  },
]

const createCostCenterSteps = [
  {
    element: "#tenant_company",
    popover: {
      title: "Empresa Seleccionada",
      description: "Un Administrador de Empresa gestiona centros de costos sobre la empresa activa.",
      position: "bottom",
    },
  },
  {
    element: "#tenant_cost_centers",
    popover: {
      title: "Centros de Costos",
      description: "Revisa los centros de costos existentes antes de registrar uno nuevo.",
      position: "bottom",
    },
  },
  {
    element: "#create_cost_center",
    popover: {
      title: "Crear Centro de Costos",
      description: "Guarda el centro de costos en la empresa seleccionada.",
      position: "bottom",
    },
  },
]

const historySteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista del historial de solicitudes que se han realizado",
      position: "bottom",
    },
  },
]

const refundsSteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista de solicitudes para reembolso",
      position: "bottom",
    },
  },
]

const approvalsSteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista de solicitudes pendientes de aprobación.",
      position: "bottom",
    },
  },
]

const refundsReviewSteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista de reembolsos que faltan por revisar.",
      position: "bottom",
    },
  },
]

const bookingsSteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista de solicitudes pendientes de reservar.",
      position: "bottom",
    },
  },
]

const checkRefundsSteps = [
  {
    element: "#list_requests",
    popover: {
      title: "Lista de Solicitudes",
      description: "Lista de reembolsos pendientes por registrar.",
      position: "bottom",
    },
  },
]

const refundPoliciesSteps = [
  {
    element: "#refund_policies_overview",
    popover: {
      title: "Qué estás viendo",
      description:
        "Esta vista administra políticas de reembolso por compañía. Una política contiene reglas para validar comprobantes y solicitudes.",
      position: "bottom",
    },
  },
  {
    element: "#refund_policies_create",
    popover: {
      title: "Cómo crear una política",
      description:
        "Primero define nombre, descripción y compañía. Luego agrega una o varias reglas.",
      position: "bottom",
    },
  },
  {
    element: "#refund_policy_rules",
    popover: {
      title: "Cómo crear una regla correcta",
      description:
        "Selecciona clase de gasto y operador desde catálogo. Si el operador requiere umbral, captura valor y unidad.",
      position: "bottom",
    },
  },
  {
    element: "#refund_policy_consequence",
    popover: {
      title: "Qué significa Consecuencia",
      description:
        "WARNING muestra observación sin bloquear. POLICY_VIOLATION bloquea el flujo hasta corregir.",
      position: "bottom",
    },
  },
  {
    element: "#refund_policy_replace_warning",
    popover: {
      title: "Importante al editar",
      description:
        "Al guardar una política con lista de reglas, el sistema reemplaza todo el conjunto de reglas de esa política.",
      position: "bottom",
    },
  },
  {
    element: "#refund_policies_tutorial_end",
    popover: {
      title: "Cierre del tutorial",
      description:
        "Empieza con una política simple de archivos obligatorios y valida su efecto antes de agregar reglas de monto o tiempo.",
      position: "bottom",
    },
  },
]

const vouchersSteps = [
  {
    element: "#vouchers",
    popover: {
      title: "Comprobantes de Gastos",
      description: "Aquí puedes agregar los comprobantes que sean necesarios.",
      position: "bottom",
    },
  },
  {
    element: "#submit-refund",
    popover: {
      title: "Envía los Comprobantes",
      description: "Una vez que hayas agregado todos los comprobantes, envíalos para su revisión.",
      position: "bottom",
    },
  },
]

const assignReservationSteps = [
  {
    element: "#reservation-info",
    popover: {
      title: "Información del Destino",
      description: "En esta sección puedes ver la información del destino de la solicitud.",
      position: "bottom",
    },
  },
  {
    element: "#hotel-reservation",
    popover: {
      title: "Reserva de Hotel",
      description: "Aquí puedes reservar el hotel para la solicitud.",
      position: "bottom",
    },
  },
  {
    element: "#plane-reservation",
    popover: {
      title: "Reserva de Vuelo",
      description: "Aquí puedes reservar el vuelo para la solicitud.",
      position: "bottom",
    },
  },
  {
    element: "#assign-reservations",
    popover: {
      title: "Asignar Reservas",
      description: "Una vez que hayas reservado el hotel y el vuelo, puedes asignar las reservas a la solicitud.",
      position: "bottom",
    },
  },
]

const refundReviewSteps = [
  {
    element: "#request-info",
    popover: {
      title: "Información de la Solicitud",
      description: "En esta sección puedes ver la información de la solicitud de reembolso.",
      position: "bottom",
    },
  },  
  {
    element: "#vouchers",
    popover: {
      title: "Información de los Comprobantes",
      description: "Aquí puedes ver los comprobantes que se han cargado para la solicitud de reembolso.",
      position: "bottom",
    },
  },  
  {
    element: "#next-voucher",
    popover: {
      title: "Ir al siguiente comprobante",
      description: "Puedes navegar entre los comprobantes cargados.",
      position: "bottom",
    },
  },  
  {
    element: "#deny-button",
    popover: {
      title: "Rechazar Comprobante",
      description: "Si consideras que un comprobante no es válido, puedes rechazarlo.",
      position: "bottom",
    },
  },  
  {
    element: "#approve-button",
    popover: {
      title: "Aprobar Comprobante",
      description: "Si consideras que un comprobante es válido, puedes aprobarlo.",
      position: "bottom",
    },
  },
  {
    element: "#refund-review",
    popover: {
      title: "Revisión de Reembolso",
      description: "Aquí puedes revisar el resumen de reembolso.",
      position: "bottom",
    },
  },
  {
    element: "#complete-refund",
    popover: {
      title: "Completar Reembolso",
      description: "Una vez que hayas revisado todos los comprobantes, puedes completar el reembolso.",
      position: "bottom",
    },
  },
]

const requestInfoSteps = [
    {
    element: "#request-info",
    popover: {
      title: "Información de la Solicitud",
      description: "Aquí puedes ver la información de la solicitud de viaje.",
      position: "bottom",
    },
  },
   {
    element: "#destinations-info",
    popover: {
      title: "Información de los destinos",
      description: "Aquí puedes ver los destinos de la solicitud de viaje.",
      position: "bottom",
    },
  },
  
   {
    element: "#revisions-info",
    popover: {
      title: "Información de las revisiones",
      description: "Aquí puedes ver las revisiones de la solicitud de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#vouchers-info",
    popover: {
      title: "Información de los comprobantes",
      description: "Aquí puedes ver los comprobantes de la solicitud de viaje.",
      position: "bottom",
    },
  },
    {
    element: "#travel-agency",
    popover: {
      title: "Agencia de Viajes",
      description: "Aquí puedes ver o asignar la agencia de viajes a la solicitud.",
      position: "bottom",
    },
  },
  {
    element: "#comment-section",
    popover: {
      title: "Comentarios de la Solicitud",
      description: "Aquí puedes ver o escribir comentarios a la solicitud de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#edit-request-button",
    popover: {
      title: "Editar Solicitud",
      description: "Aquí puedes editar la solicitud de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#cancel-request-button",
    popover: {
      title: "Cancelar Solicitud",
      description: "Aquí puedes cancelar la solicitud de viaje.",
      position: "bottom",
    },
  },
  {
    element: "#approve-request-button",
    popover: {
      title: "Aprobar Solicitud",
      description: " Aquí puedes aprobar la solicitud de viaje. Recuerda que debes tener una agencia de viajes asignada.",
      position: "bottom",
    },
  },
    {
    element: "#changes-request-button",
    popover: {
      title: "Solicitar Cambios a la Solicitud",
      description: "Aquí puedes solicitar cambios a la solicitud de viaje. Recuerda que debes poner una justificación en los comentarios.",
      position: "bottom",
    },
  },
    {
    element: "#deny-request-button",
    popover: {
      title: "Denegar Solicitud",
      description: "Aquí puedes denegar la solicitud de viaje.",
      position: "bottom",
    },
  }
]

const stepsMap: Record<string, typeof dashboardSteps> = {
  dashboard: dashboardSteps,
  createRequest: createRequestSteps,
  createCompany: createCompanySteps,
  createDepartment: createDepartmentSteps,
  createCostCenter: createCostCenterSteps,
  createTenant: createCompanySteps,
  history: historySteps,
  refunds: refundsSteps,
  vouchers: vouchersSteps,
  approvals: approvalsSteps,
  refundsReview: refundsReviewSteps,
  bookings: bookingsSteps,
  reservations: assignReservationSteps,
  checkRefunds: checkRefundsSteps,
  refundPolicies: refundPoliciesSteps,
  refundReview: refundReviewSteps,
  requestInfo: requestInfoSteps,
};

interface TutorialProps {
   children: React.ReactNode;
  page: "dashboard" | "createRequest" | "createCompany" | "createDepartment" | "createCostCenter" | "createTenant" | "history" | "refunds" | "vouchers" | "approvals" | "refundsReview" | "bookings" | "assignReservation" | "reservations" | "checkRefunds" | "refundPolicies" | "refundReview" | "requestInfo";
   run?: boolean;
  }

export const Tutorial = ({ children,page, run = false }: TutorialProps) => {
  const { setTutorial } = useApp();
  useEffect(() => {
    if (!run) return; // Exit early if run is false
    // Wait for DOM to be fully loaded and elements to be present
    const timeout = setTimeout(() => {
      const steps = stepsMap[page] || dashboardSteps;
      const filteredSteps = steps.filter(step => {
        if (!step.element) return false;
        const el = document.querySelector(step.element);
        return Boolean(el);
      });
      if (filteredSteps.length === 0) {
        console.warn("No valid steps found for the tutorial.");
        return;
      }
      // Initialize the driver with the filtered steps
      const drv = driver({
          doneBtnText: "Finalizar",
          nextBtnText: "Siguiente",
          prevBtnText: "Anterior",
          animate: true,
          allowClose: true,
      });
      drv.setSteps(filteredSteps);
      drv.drive();
      setTutorial(false); // Set tutorial to false after running
    }, 500);
    
    // Cleanup to prevent duplicate driver instances
    return () => {
      clearTimeout(timeout);
      // Optionally destroy any existing driver instance if API allows
      // drv?.destroy?.();
    };
  }, [run]);
  return children;
};
