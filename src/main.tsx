import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateTravelRequest from "./pages/CreateTravelRequest.tsx";
import EditTravelRequest from "./pages/EditTravelRequest.tsx";

import {
  PermissionProtectedRoute,
  RoleProtectedRoute,
} from "./hooks/auth/authContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import "flowbite";

// ******************* Styles ******************
import "./index.css";
import "./App.css";

// ****************** Pages ******************
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Error from "./pages/Error.tsx";
import Historial from "./pages/Historial/Historial.tsx";
import Bookings from "./pages/Bookings.tsx";
import Roles from "./pages/Roles/Roles.tsx";
import ApprovalRules from "./pages/ApprovalRules/ApprovalRules.tsx";
import PoliciesDashboard from "./pages/Policies.tsx";
import { Refunds } from "./pages/Refunds/Refunds.tsx";
import { Vouchers } from "./pages/Refunds/Vouchers.tsx";
import Reservations from "./pages/Reservations/Reservations.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import RefundsAcceptance from "./pages/Refunds/RefundsAcceptance.tsx";
import { Unauthorized } from "./pages/Unauthorized.tsx";
import RequestInfo from "./pages/RequestInfo.tsx";
import { Approvals } from "./pages/Approvals/Approvals.tsx";
import { RefundsReview } from "./pages/Refunds/RefundsReview.tsx";
import { CheckRefunds } from "./pages/Refunds/CheckRefunds.tsx";
import CreateCompany from "./pages/Admin/CreateCompany.tsx";
import Companies from "./pages/Admin/Companies.tsx";
import CreateDepartment from "./pages/Admin/CreateDepartment.tsx";
import CreateCostCenter from "./pages/Admin/CreateCostCenter.tsx";
import Departments from "./pages/Admin/Departments.tsx";
import ImportDepartments from "./pages/Admin/ImportDepartments.tsx";
import CreateAccountingAccount from "./pages/Admin/CreateAccountingAccount.tsx";
import CreateBankAccount from "./pages/Admin/CreateBankAccount.tsx";
import ImportBankAccounts from "./pages/Admin/ImportBankAccounts.tsx";
import ImportAccountingAccounts from "./pages/Admin/ImportAccountingAccounts.tsx";
import EditAccountingAccount from "./pages/Admin/EditAccountingAccount.tsx";
import RefundPolicies from "./pages/Admin/RefundPolicies.tsx";
import CostCenterList from "./components/Admin/CostCenterList.tsx";
import AccountingAccountsList from "./components/Admin/AccountingAccountList.tsx";
import ImportEmployees from "./pages/CompanyAdmin/ImportEmployees.tsx";
import ViewEmployees from "./pages/CompanyAdmin/ViewEmployees.tsx";
import ImportCostCenters from "./pages/Admin/ImportCostCenters.tsx";
import { VoucherHistory } from "./pages/Historial/VoucherHistory.tsx";
import BankAccountsList from "./components/Admin/BankAccountList.tsx";

export const router = createBrowserRouter([
  // Public routes (no authentication required)
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },

  // Basic protected routes (requires only authentication)
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard title="Inicio" />,
      },
      {
        path: "/approvals",
        element: <Approvals />,
      },
      {
        path: "/requests/:id",
        element: <RequestInfo />,
      },
      {
        path: "/requests/create",
        element: <CreateTravelRequest />,
      },
      {
        path: "/requests/:id/edit",
        element: <EditTravelRequest />,
      },
      {
        path: "/history",
        element: <Historial />,
      },
      {
        path: "/vouchers-history",
        element: <VoucherHistory />,
      },
      {
        path: "/refunds",
        element: <Refunds />,
      },
      {
        path: "/refunds/:id",
        element: <Vouchers />,
      },
      {
        path: "/check-refunds",
        element: <CheckRefunds />,
      },
      {
        path: "/bookings",
        element: <Bookings />,
      },
      {
        path: "/bookings/:id",
        element: <Reservations />,
      },
      {
        path: "/refunds-review",
        element: <RefundsReview />,
      },
      {
        path: "/refunds-review/:id",
        element: <RefundsAcceptance />,
      },
      {
        path: "/policies", // Nueva ruta
        element: <PoliciesDashboard />,
      },
      {
        path: "/roles",
        element: (
          <RoleProtectedRoute requiredRoles={["Aprobador"]} />
        ),
        children: [
          {
            path: "",
            element: <Roles />,
          },
        ],
      },
      {
        path: "/approval-rules",
        element: <RoleProtectedRoute requiredRoles={["CompanyAdmin"]} />,
        children: [
          {
            path: "",
            element: <ApprovalRules />,
          },
        ],
      },
      {
        path: "/admin/companies",
        element: <RoleProtectedRoute requiredRoles={["SuperAdmin"]} />,
        children: [
          {
            path: "",
            element: <Companies />,
          },
          {
            path: "create",
            element: <CreateCompany />,
          },
        ],
      },
      {
        path: "/admin/departments",
        element: (
          <RoleProtectedRoute
            requiredRoles={["CompanyAdmin"]}
            requireCompanyId={true}
          />
        ),
        children: [
          {
            path: "",
            element: <Departments />,
          },
          {
            path: "create",
            element: <CreateDepartment />,
          },
          {
            path: "import",
            element: <ImportDepartments />,
          },
        ],
      },
      {
        path: "/admin/cost-centers",
        element: (
          <RoleProtectedRoute
            requiredRoles={["CompanyAdmin"]}
            requireCompanyId={true}
          />
        ),
        children: [
          {
            path: "",
            element: <CostCenterList />,
          },
          {
            path: "create",
            element: <CreateCostCenter />,
          },
          {
            path: "import",
            element: <ImportCostCenters />,
          },
        ],
      },
      {
        path: "/admin/accounting-accounts",
        element: (
          <RoleProtectedRoute
            requiredRoles={["CompanyAdmin"]}
            requireCompanyId={true}
          />
        ),
        children: [
          {
            path: "",
            element: <AccountingAccountsList />,
          },
          {
            path: "create",
            element: <CreateAccountingAccount />,
          },
          {
            path: "import",
            element: <ImportAccountingAccounts />,
          },
          {
            path: ":id/edit",
            element: (
              <RoleProtectedRoute
                requiredRoles={["CompanyAdmin"]}
                requireCompanyId={true}
              />
            ),
            children: [
              {
                path: "",
                element: <EditAccountingAccount />,
              },
            ],
          },
        ],
      },
      {
        path: "/admin/bank-accounts",
        element: (
          <RoleProtectedRoute
            requiredRoles={["CompanyAdmin"]}
            requireCompanyId={true}
          />
        ),
        children: [
          {
            path: "",
            element: <BankAccountsList />,
          },
          {
            path: "create",
            element: <CreateBankAccount />,
          },
          {
            path: "import",
            element: <ImportBankAccounts />,
          },
        ],
      },
      {
        path: "/admin/refund-policies",
        element: <RoleProtectedRoute requiredRoles={["CompanyAdmin"]} />,
        children: [
          {
            path: "",
            element: <RefundPolicies />,
          },
        ],
      },
      {
        path: "/company-admin/import-employees",
        element: (
          <PermissionProtectedRoute
            requiredPermissions={["import_employees"]}
          />
        ),
        children: [
          {
            path: "",
            element: <ImportEmployees />,
          },
        ],
      },
      {
        path: "/company-admin/view-employees",
        element: (
          <RoleProtectedRoute requiredRoles={["CompanyAdmin"]} />
        ),
        children: [
          {
            path: "",
            element: <ViewEmployees />,
          },
        ],
      },
      {
        path: "/approval",
        element: (
          <PermissionProtectedRoute requiredPermissions={["approve_trip"]} />
        ),
        children: [
          {
            path: "",
            element: <div>Trips to Approve</div>,
          },
          {
            path: "history",
            element: (
              <PermissionProtectedRoute
                requiredPermissions={["view_approval_history"]}
              />
            ),
            children: [
              {
                path: "",
                element: <div>Approval History</div>,
              },
            ],
          },
        ],
      },
      // Routes protected for booking permission
      {
        path: "/booking",
        element: (
          <PermissionProtectedRoute requiredPermissions={["book_trip"]} />
        ),
        children: [
          {
            path: "history",
            element: (
              <PermissionProtectedRoute
                requiredPermissions={["view_booking_history"]}
              />
            ),
            children: [
              {
                path: "",
                element: <div>Booking History</div>, // Replace with your actual component
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Error />,
  },
]);

const queryClient = new QueryClient();

if (import.meta.env.PROD || !import.meta.env.TEST) {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  }
}
