import { Outlet } from "react-router-dom";
import { AuthProvider } from "../hooks/auth/authContext";
import { AppProvider } from "../hooks/app/appContext";
import Layout from "../components/Layout";

export const ProtectedRoute = () => (
  <AuthProvider>
    <AppProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AppProvider>
  </AuthProvider>
);
