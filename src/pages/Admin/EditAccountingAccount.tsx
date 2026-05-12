import { useParams } from "react-router-dom";
import EditAccountingAccountForm from "../../components/Admin/EditAccountingAccountForm.tsx";
import { useGetCompanyAccountingAccount } from "../../hooks/companies/useGetCompanyAccountingAccount";
import { useAuth } from "../../hooks/auth/authContext";

function EditAccountingAccount() {
  const { id } = useParams<{ id: string }>();
  const { authState } = useAuth();
  const profileCompanyId = authState.userCompanyId ?? "";

  const { data: accountingAccount, isLoading } = useGetCompanyAccountingAccount(profileCompanyId, id);

  if (isLoading) return <div>Cargando...</div>;
  if (!accountingAccount) return <div>No se encontró la cuenta contable</div>;

  return <EditAccountingAccountForm accountingAccountId={id!} initialData={accountingAccount} />;
}

export default EditAccountingAccount;
