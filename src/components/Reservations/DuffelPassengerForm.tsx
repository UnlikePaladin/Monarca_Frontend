import React, { useState } from "react";
import { DuffelOffer, DuffelPassengerTitle } from "../../types/duffel";
import InputField from "../Refunds/InputField";
import Dropdown from "../Refunds/DropDown";

interface Props {
  offer: DuffelOffer;
  initialData: {
    name: string;
    last_name: string;
    email: string;
  };
  onSubmit: (passengerData: any) => void;
  isSubmitting: boolean;
}

export const DuffelPassengerForm: React.FC<Props> = ({ offer, initialData, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    title: "mr" as DuffelPassengerTitle,
    given_name: initialData.name,
    family_name: initialData.last_name,
    born_on: "", // YYYY-MM-DD (Obligatorio para aerolíneas)
    email: initialData.email,
    phone_number: "+52", // Formato E.164 (Obligatorio)
  });

  const titles = [
    { value: "mr", label: "Sr." },
    { value: "ms", label: "Srta." },
    { value: "mrs", label: "Sra." },
    { value: "miss", label: "Mina" },
  ];

   const handleInternalSubmit = () => {
    // Validación simple antes de enviar
    if(!formData.born_on || !formData.phone_number) {
        alert("Por favor completa la fecha de nacimiento y teléfono");
        return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-md border border-green-100">
      <h5 className="text-sm font-bold text-gray-700 border-b pb-2">Información Legal del Pasajero</h5>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Dropdown
          label="Título"
          options={titles}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value as DuffelPassengerTitle })}
        />
        <InputField
          label="Nombre(s)"
          value={formData.given_name}
          onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
          required
        />
        <InputField
          label="Apellido(s)"
          value={formData.family_name}
          onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Fecha de Nacimiento"
          type="date"
          value={formData.born_on}
          onChange={(e) => setFormData({ ...formData, born_on: e.target.value })}
          required
        />
        <InputField
          label="Email de contacto"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <InputField
          label="Teléfono (Formato +52...)"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="+525512345678"
          required
        />
      </div>

      <div className="pt-4 flex items-center justify-between border-t mt-4">
        <div className="text-sm text-gray-600">
          Total a pagar: <span className="font-bold text-green-700">{offer.price?.total_amount || offer.total_amount} {offer.price?.total_currency || offer.total_currency}</span>
        </div>
        <button
          type="button"
          onClick={handleInternalSubmit}
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-md font-bold text-white transition-all ${
            isSubmitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-200"
          }`}
        >
          {isSubmitting ? "Emitiendo Boleto..." : "Confirmar y Reservar Vuelo"}
        </button>
      </div>
    </div>
  );
};