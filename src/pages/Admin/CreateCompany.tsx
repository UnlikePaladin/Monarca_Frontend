import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import CreateCompanyForm from "../../components/Admin/CreateCompanyForm";
import { useApp } from "../../hooks/app/appContext";

function CreateCompany() {
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
      <Tutorial page="createTenant" run={tutorial}>
        <CreateCompanyForm />
      </Tutorial>
    </div>
  );
}

export default CreateCompany;
