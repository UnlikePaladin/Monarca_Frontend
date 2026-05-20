/*Defines an authentication and authorization system using React Context to manage user session data globally. The AuthContext stores the authentication state (authState), including whether the user is authenticated, their personal information, role, and permissions, as well as a loading flag and a logout handler. When the AuthProvider mounts, it fetches the user profile from /login/profile to determine if the user is authenticated and populates the context accordingly. 
The handleLogout function calls /login/logout and resets the authentication state. Additionally, the file includes route protection components: ProtectedRoute, which wraps routes with AuthProvider, AppProvider, and a shared Layout, and PermissionProtectedRoute, which restricts access based on required permissions (either requiring all or any of them) and redirects unauthorized users to specific routes.*/

// src/hooks/auth/authContext.tsx
import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";

import { getRequest, postRequest } from "../../utils/apiService";

// Define permissions
export type Permission = string;

const parsePermissions = (value: unknown): Permission[] => {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((permissionItem) => {
      if (typeof permissionItem === "string") {
        return permissionItem;
      }

      if (permissionItem && typeof permissionItem === "object") {
        const raw = permissionItem as {
          name?: unknown;
          permission?: unknown;
          code?: unknown;
        };

        if (
          raw.permission &&
          typeof raw.permission === "object" &&
          typeof (raw.permission as { name?: unknown }).name === "string"
        ) {
          return (raw.permission as { name: string }).name;
        }

        if (typeof raw.name === "string") return raw.name;
        if (typeof raw.permission === "string") return raw.permission;
        if (typeof raw.code === "string") return raw.code;
      }

      return "";
    })
    .filter((permission): permission is Permission => Boolean(permission));

  return Array.from(new Set(normalized));
};

const normalizeRole = (role: string): string =>
  role.toLowerCase().replace(/[_\s-]/g, "");

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const getUserCompanyId = (user: unknown): string => {
  const userRecord = asRecord(user);
  const department = asRecord(userRecord.department);
  const departmentCompany = asRecord(department.company);

  return pickString(
    department.id_company,
    department.companyId,
    department.company_id,
    department.companyID,
    departmentCompany.id,
    departmentCompany.id_company,
    departmentCompany.companyId,
    departmentCompany.company_id
  );
};

export interface ContextType {
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  loadingProfile: Boolean;
  handleLogout: () => Promise<void>;
}
// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  userId: string;
  userName: string;
  userLastName: string;
  userEmail: string;
  userPermissions: Permission[];
  userRole: string;
  userRoleId: string;
  userCompanyId?: string;
}

// Create the auth context with proper typing
export const AuthContext = createContext<ContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = (): ContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loadingProfile, setLoadingProfile] = React.useState<Boolean>(true);
  const [authState, setAuthState] = React.useState<AuthState>({
    isAuthenticated: false,
    userId: "",
    userName: "",
    userLastName: "",
    userRole: "",
    userRoleId: "",
    userEmail: "",
    userPermissions: [],
    userCompanyId: "",
  });

  useEffect(() => {
    const getAuthState = async () => {
      getRequest("/login/profile")
        .then((response) => {
          if (response?.status) {
            setAuthState({
              isAuthenticated: true,
              userId: response.user.id,
              userName: response.user.name,
              // API can sometimes omit optional fields; fall back to empty strings
              userLastName: response.user.lastName ?? "",
              userRole: response.user.role?.name ?? "",
              userRoleId: response.user.role?.id ?? "",
              userPermissions: parsePermissions(
                response.user.role?.rolePermissions ??
                  response.user.role?.permissions ??
                  response.user.permissions,
              ),
              userEmail: response.user.email ?? "",
              userCompanyId: getUserCompanyId(response.user),
            });
            setLoadingProfile(false);
          } else {
            setAuthState((prevState) => ({
              ...prevState,
              isAuthenticated: false,
            }));
            setLoadingProfile(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching auth state:", error);
          setAuthState((prevState) => ({
            ...prevState,
            isAuthenticated: false,
          }));
          setLoadingProfile(false);
        });
    };

    getAuthState();
  }, []);

  const handleLogout = async () => {
    const response = await postRequest("/login/logout", {});
    if (response.status) {
      setAuthState({
        isAuthenticated: false,
        userId: "",
        userName: "",
        userLastName: "",
        userRole: "",
        userRoleId: "",
        userEmail: "",
        userPermissions: [],
        userCompanyId: "",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        setAuthState,
        loadingProfile,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Permission-based protected route component
interface PermissionProtectedRouteProps {
  requiredPermissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission is sufficient
}

interface RoleProtectedRouteProps {
  requiredRoles: string[];
  requireCompanyId?: boolean;
}

export const PermissionProtectedRoute: React.FC<
  PermissionProtectedRouteProps
> = ({ requiredPermissions, requireAll = true }) => {
  const { authState } = useAuth();

  // First check authentication
  if (!authState.isAuthenticated) {
    return <Navigate to="/example" replace />;
  }

  // Then check permissions
  const hasPermission = requireAll
    ? requiredPermissions.every((permission) =>
        authState.userPermissions.includes(permission),
      )
    : requiredPermissions.some((permission) =>
        authState.userPermissions.includes(permission),
      );

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  requiredRoles,
  requireCompanyId = false,
}) => {
  const { authState } = useAuth();

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const allowedRoles = requiredRoles.map((role) => normalizeRole(role));
  const hasRole = allowedRoles.includes(normalizeRole(authState.userRole));

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireCompanyId && !authState.userCompanyId) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
