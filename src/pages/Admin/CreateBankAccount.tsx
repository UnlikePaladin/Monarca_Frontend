import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import { useApp } from "../../hooks/app/appContext";
import CreateBankAccountForm from "../../components/Admin/CreateBankAccountForm";

function CreateBankAccount() {
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
      <Tutorial page="createBankAccounts" run={tutorial}>
        <CreateBankAccountForm />
      </Tutorial>
    </div>
  );
}

export default CreateBankAccount;
