import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import { useApp } from "../../hooks/app/appContext";
import CreateAccountingAccountForm from "../../components/Admin/CreateAccountingAccountForm";

function CreateAccountingAccount() {
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
        <CreateAccountingAccountForm />
      </Tutorial>
    </div>
  );
}

export default CreateAccountingAccount;
