/*This Requests component is a simple wrapper page that renders the RequestRow component inside a styled container. It adds top margin and horizontal padding using Tailwind CSS classes, and delegates all request-related logic and UI rendering to the RequestRow component. Essentially, it acts as a layout-level page component for displaying a list or row of travel requests. */

import RequestRow from "../components/RequestRow";

function Requests() {
  return (
    <div className="mt-6 px-4">
      <RequestRow />
    </div>
  );
}

export default Requests;
