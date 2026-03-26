/*This component (EditTravelRequest) renders a page for editing an existing travel request. It retrieves the request id from the URL using useParams and fetches the corresponding data through the custom hook useGetRequest, which handles the API call and loading state. While the data is being fetched, it displays a loading message; if no request is found, it shows an error message. Once the data is successfully loaded, it renders the TravelRequestForm component, passing the requestId and the fetched request data as initialData, allowing the form to be pre-filled for editing. */

import { useParams } from "react-router-dom";
import TravelRequestForm from "../components/travel-requests/TravelRequestForm";
import { useGetRequest } from "../hooks/requests/useGetRequest";

function EditTravelRequest() {
  const { id } = useParams<{ id: string }>();
  const { data: travelRequest, isLoading } = useGetRequest(id!);

  console.log(travelRequest);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!travelRequest) {
    return <div>No se encontró la solicitud de viaje</div>;
  }

  return (
    <div>
      <TravelRequestForm requestId={id} initialData={travelRequest} />
    </div>
  );
}

export default EditTravelRequest;
