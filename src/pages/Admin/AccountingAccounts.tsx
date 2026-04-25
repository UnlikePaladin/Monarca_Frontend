import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import AccountingAccountsManagement from "../../components/Admin/AccountingAccountsManagement";
import { useApp } from "../../hooks/app/appContext";

function AccountingAccounts() {
  const { handleVisitPage, tutorial, setTutorial } = useApp();

  useEffect(() => {
    const visitedPages = JSON.parse(localStorage.getItem("visitedPages") || "[]");
    const isPageVisited = visitedPages.includes(location.pathname);

    if (!isPageVisited) {
      setTutorial(true);
    }

    handleVisitPage();
  }, []);

  return (
    <div>
      <Tutorial page="createAccountingAccounts" run={tutorial}>
        <AccountingAccountsManagement />
      </Tutorial>
    </div>
  );
}

export default AccountingAccounts;
