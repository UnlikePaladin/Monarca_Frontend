import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import CreateCostCenterForm from "../../components/Admin/CreateCostCenterForm";
import { useApp } from "../../hooks/app/appContext";

function CreateCostCenter() {
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
      <Tutorial page="createCostCenter" run={tutorial}>
        <CreateCostCenterForm />
      </Tutorial>
    </div>
  );
}

export default CreateCostCenter;