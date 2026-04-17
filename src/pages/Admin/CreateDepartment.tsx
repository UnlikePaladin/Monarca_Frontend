import { useEffect } from "react";

import { Tutorial } from "../../components/Tutorial";
import CreateDepartmentForm from "../../components/Admin/CreateDepartmentForm";
import { useApp } from "../../hooks/app/appContext";

function CreateDepartment() {
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
        <CreateDepartmentForm />
      </Tutorial>
    </div>
  );
}

export default CreateDepartment;
