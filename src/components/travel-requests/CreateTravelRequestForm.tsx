/**
 * CreateTravelRequestForm.tsx
 * 
 * Form component for creating new travel requests.
 * Handles multi-destination travel requests with validation and submission.
 */

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { TextArea } from "../ui/TextArea";
import Switch from "../ui/Switch";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { useForm, Controller, useFieldArray } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Select from "../ui/Select";
import FieldError from "../ui/FieldError";

import { useCreateTravelRequest } from "../../hooks/requests/useCreateRequest";
import { useDestinations } from "../../hooks/destinations/useDestinations";
import { useExchangeRate } from "../../hooks/exchange-rate/useExchangeRate";
import formatMoney from "../../utils/formatMoney";

type Option = { id: number | string; name: string };

const priorityOptions: Option[] = [
  { id: "alta", name: "Alta" },
  { id: "media", name: "Media" },
  { id: "baja", name: "Baja" },
];

const currencyCodes: string[] = [
  "MXN",
  "USD",
  "EUR",
  "JPY",
  "CNY",
];

const destinationSchema = z.object({
  id_destination: z
    .string()
    .nullable()
    .refine((v) => v !== null && v !== "", {
      message: "Selecciona un destino",
    }),
  id_airport: z.string().nullable().optional(),
  arrival_date: z.string().nonempty({ message: "Selecciona fecha de llegada" }),
  departure_date: z
    .string()
    .nonempty({ message: "Selecciona fecha de salida" }),
  stay_days: z
    .number()
    .int()
    .positive({ message: "El número de días debe ser positivo" }),
  is_hotel_required: z.boolean(),
  is_plane_required: z.boolean(),
  details: z.string().nonempty({ message: "Selecciona fecha de llegada" }),
}).superRefine((value, ctx) => {
  if (value.is_plane_required && !value.id_airport) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["id_airport"],
      message: "Selecciona un aeropuerto para el tramo con vuelo",
    });
  }

  if (!value.is_plane_required && value.id_airport) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["id_airport"],
      message: "El aeropuerto debe omitirse cuando no se requiere vuelo",
    });
  }
});

const formSchema = z.object({
  id_origin_city: z.string().nullable(),
  id_origin_airport: z.string().nullable().optional(),
  motive: z.string().nonempty({ message: "Escribe el motivo del viaje" }),
  title: z.string().nonempty({ message: "Escribe el título del viaje" }),
  priority: z.enum(["alta", "media", "baja"]),
  requirements: z.string().optional(),
  advance_currency: z.enum([...currencyCodes] as [string, ...string[]], {
    message: "Selecciona una divisa válida",
  }),
  advance_money: z
    .number()
    .int()
    .positive({ message: "El dinero adelantado debe ser positivo" }),
  destinations: z.array(destinationSchema).min(1, "Al menos un destino"),
});

type RawFormValues = z.infer<typeof formSchema>;

function CreateTravelRequestForm() {
  const navigate = useNavigate();
  const { destinations, destinationOptions, isLoading: isLoadingDestinations } =
    useDestinations();

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RawFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_origin_city: null,
      id_origin_airport: null,
      motive: "",
      title: "",
      priority: "media",
      advance_currency: "MXN",
      advance_money: 0,
      requirements: "",
      destinations: [
        {
          id_destination: null,
          id_airport: null,
          arrival_date: "",
          departure_date: "",
          stay_days: 1,
          is_hotel_required: false,
          is_plane_required: true,
          details: "",
        },
      ],
    },
  });

  const { createTravelRequestMutation, isPending } = useCreateTravelRequest();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "destinations",
  });

  const originCityId = watch("id_origin_city");
  const advanceCurrency = watch("advance_currency");
  const advanceMoney = watch("advance_money");

  const currencySelectOptions = useMemo<Option[]>(
    () => currencyCodes.map((code) => ({ id: code, name: code })),
    []
  );

  const normalizedAdvanceMoney = Number.isFinite(advanceMoney)
    ? advanceMoney
    : 0;
  const exchangeRateDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const shouldFetchRate =
    !!advanceCurrency && advanceCurrency !== "MXN" && normalizedAdvanceMoney > 0;
  const {
    data: exchangeRate,
    isLoading: isRateLoading,
    error: exchangeRateError,
  } = useExchangeRate(exchangeRateDate, advanceCurrency || "MXN", shouldFetchRate);
  const advanceMoneyMxn = useMemo(() => {
    if (advanceCurrency === "MXN") {
      return normalizedAdvanceMoney;
    }
    if (normalizedAdvanceMoney === 0) {
      return 0;
    }
    if (!exchangeRate?.rate) {
      return null;
    }
    return Number((normalizedAdvanceMoney * exchangeRate.rate).toFixed(2));
  }, [advanceCurrency, normalizedAdvanceMoney, exchangeRate?.rate]);

  const originAirportOptions =
    destinations
      .find((d) => d.id === originCityId)
      ?.airports?.map((airport) => ({
        id: airport.id,
        name: `${airport.iata_code} - ${airport.name}${airport.is_primary ? " (Principal)" : ""}`,
      })) || [];

  const onSubmit = async (data: RawFormValues) => {
    if (!data.id_origin_city) {
      toast.error("Selecciona una ciudad de origen");
      return;
    }

    if (data.advance_currency !== "MXN" && data.advance_money > 0) {
      if (isRateLoading) {
        toast.info("Cargando tipo de cambio...");
        return;
      }
      if (!exchangeRate?.rate) {
        toast.error("No se pudo obtener el tipo de cambio a MXN");
        return;
      }
    }

    const requests_destinations = data.destinations.map((d, idx, arr) => {
      // id_destination is guaranteed non-empty by the Zod refine on destinationSchema
      return {
        id_destination: d.id_destination as string,
        ...(d.is_plane_required && d.id_airport ? { id_airport: d.id_airport } : {}),
        destination_order: idx + 1,
        stay_days: d.stay_days,
        arrival_date: dayjs(d.arrival_date).toISOString(),
        departure_date: dayjs(d.departure_date).toISOString(),
        is_hotel_required: d.is_hotel_required,
        is_plane_required: d.is_plane_required,
        is_last_destination: idx === arr.length - 1,
        details: d.details,
      };
    });

    const payload = {
      id_origin_city: data.id_origin_city,
      id_origin_airport: data.id_origin_airport || undefined,
      title: data.motive,
      motive: data.motive,
      requirements: data.requirements || undefined,
      priority: data.priority,
      advance_money: 
        data.advance_currency === "MXN"
          ? data.advance_money
          : Number((data.advance_money * (exchangeRate?.rate || 0)).toFixed(2)),
      requests_destinations,
    };

    try {
      await createTravelRequestMutation(payload);
      toast.success("¡Solicitud de viaje creada exitosamente!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      reset();
      navigate("/dashboard");
    } catch (error) {
      let errorMessage = "Error al crear la solicitud de viaje";

      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  return (
    <section className="bg-gray-200 rounded-md">
      <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
        <h2 className="mb-4 text-xl font-bold text-gray-900 ">
          Datos del Viaje
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="sm:col-span-2">
              <label
                htmlFor="motive"
                className="block mb-2 text-sm font-medium text-gray-900 "
              >
                Motivo
              </label>
              <Input {...register("motive")} />
              {errors.motive && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.motive.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Título
              </label>
              <Input {...register("title")} />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Ciudad Origen
              </label>
              <Controller
                control={control}
                name="id_origin_city"
                render={({ field }) => (
                  <Select
                    options={destinationOptions}
                    value={
                      field.value
                        ? destinationOptions.find((o) => o.id === field.value)
                        : null
                    }
                    onChange={(opt) => {
                      field.onChange(opt.id);
                      setValue("id_origin_airport", null);
                    }}
                    isLoading={isLoadingDestinations}
                    placeholder="Selecciona ciudad de origen"
                  />
                )}
              />
              {errors.id_origin_city && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.id_origin_city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Aeropuerto de origen
              </label>
              <Controller
                control={control}
                name="id_origin_airport"
                render={({ field }) => (
                  <Select
                    options={originAirportOptions}
                    value={
                      field.value
                        ? originAirportOptions.find((o) => o.id === field.value)
                        : null
                    }
                    onChange={(opt) => field.onChange(opt.id)}
                    isDisabled={!originCityId}
                    placeholder={
                      originCityId
                        ? "Selecciona aeropuerto de origen (opcional)"
                        : "Selecciona ciudad primero"
                    }
                  />
                )}
              />
              <FieldError msg={errors.id_origin_airport?.message} />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Prioridad
              </label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select
                    options={priorityOptions}
                    value={priorityOptions.find((o) => o.id === field.value)}
                    onChange={(opt) => field.onChange(opt.id)}
                  />
                )}
              />
              {errors.priority && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Dinero adelantado 
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  className="flex-1"
                  {...register(`advance_money` as const, {
                    valueAsNumber: true,
                  })}
                />
                <div className="min-w-[120px]">
                  <label htmlFor="advance_currency" className="sr-only">
                    Divisa
                  </label>
                  <Controller
                    control={control}
                    name="advance_currency"
                    render={({ field }) => (
                      <Select
                        id="advance_currency"
                        options={currencySelectOptions}
                        value={
                          currencySelectOptions.find(
                            (o) => o.id === field.value
                          ) || null
                        }
                        onChange={(opt) => field.onChange(opt.id)}
                        placeholder="Divisa"
                      />
                    )}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {advanceCurrency === "MXN"
                  ? `Se guardará en MXN: ${formatMoney(
                      normalizedAdvanceMoney
                    )}.`
                  : isRateLoading
                    ? "Consultando tipo de cambio a MXN..."
                    : exchangeRateError || advanceMoneyMxn === null
                      ? "No se pudo obtener el tipo de cambio a MXN."
                      : `Equivalente en MXN: ${formatMoney(advanceMoneyMxn)}.`}
              </p>
              <FieldError msg={errors?.advance_money?.message} />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Requerimientos
              </label>
              <TextArea rows={4} {...register("requirements")} />
              {errors.requirements && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.requirements.message}
                </p>
              )}
            </div>
          </div>
          <h3 className="mt-8 mb-4 text-lg font-semibold">Destinos</h3>

          {fields.map((field, idx) => {
            const destinationErrors = errors.destinations?.[idx];
            const selectedDestinationId = watch(`destinations.${idx}.id_destination` as const);
            const isPlaneRequired = watch(`destinations.${idx}.is_plane_required` as const);

            const airportOptions =
              destinations
                .find((d) => d.id === selectedDestinationId)
                ?.airports?.map((airport) => ({
                  id: airport.id,
                  name: `${airport.iata_code} - ${airport.name}${airport.is_primary ? " (Principal)" : ""}`,
                })) || [];

            return (
              <div
                key={field.id}
                className="rounded-md p-4 mb-6 space-y-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Destino #{idx + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" onClick={() => remove(idx)}>
                      Quitar
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Destino
                    </label>
                    <Controller
                      control={control}
                      name={`destinations.${idx}.id_destination`}
                      render={({ field }) => (
                        <Select
                          options={destinationOptions}
                          value={
                            field.value
                              ? destinationOptions.find(
                                  (o) => o.id === field.value
                                )
                              : null
                          }
                          onChange={(opt) => {
                            field.onChange(opt.id);
                            setValue(`destinations.${idx}.id_airport`, null);
                          }}
                          isLoading={isLoadingDestinations}
                          placeholder="Selecciona destino"
                        />
                      )}
                    />
                    <FieldError
                      msg={destinationErrors?.id_destination?.message}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Aeropuerto
                    </label>
                    <Controller
                      control={control}
                      name={`destinations.${idx}.id_airport`}
                      render={({ field }) => (
                        <Select
                          options={airportOptions}
                          value={
                            field.value
                              ? airportOptions.find((o) => o.id === field.value)
                              : null
                          }
                          onChange={(opt) => field.onChange(opt.id)}
                          isDisabled={!selectedDestinationId || !isPlaneRequired}
                          placeholder={
                            !selectedDestinationId
                              ? "Selecciona destino primero"
                              : isPlaneRequired
                              ? "Selecciona aeropuerto"
                              : "No aplica sin vuelo"
                          }
                        />
                      )}
                    />
                    <FieldError msg={destinationErrors?.id_airport?.message} />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Fecha llegada
                    </label>
                    <Input
                      type="date"
                      {...register(`destinations.${idx}.arrival_date` as const)}
                    />
                    <FieldError
                      msg={destinationErrors?.arrival_date?.message}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Fecha salida
                    </label>
                    <Input
                      type="date"
                      {...register(
                        `destinations.${idx}.departure_date` as const
                      )}
                    />
                    <FieldError
                      msg={destinationErrors?.departure_date?.message}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      No. días estancia
                    </label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`destinations.${idx}.stay_days` as const, {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError msg={destinationErrors?.stay_days?.message} />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Detalles
                    </label>
                    <Input
                      {...register(`destinations.${idx}.details` as const)}
                    />
                    <FieldError msg={destinationErrors?.details?.message} />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      ¿Necesita hotel?
                    </label>
                    <Controller
                      control={control}
                      name={`destinations.${idx}.is_hotel_required` as const}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FieldError
                      msg={destinationErrors?.is_hotel_required?.message}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      ¿Necesita vuelo?
                    </label>
                    <Controller
                      control={control}
                      name={`destinations.${idx}.is_plane_required` as const}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              setValue(`destinations.${idx}.id_airport`, null);
                            }
                          }}
                        />
                      )}
                    />
                    <FieldError
                      msg={destinationErrors?.is_plane_required?.message}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            onClick={() =>
              append({
                id_destination: null,
                arrival_date: "",
                departure_date: "",
                stay_days: 1,
                is_hotel_required: false,
                is_plane_required: true,
                details: "",
              })
            }
          >
            + Añadir destino
          </Button>

          <Button type="submit" className="mt-4 sm:mt-6" disabled={isPending}>
            {isPending ? "Creando..." : "Crear viaje"}
          </Button>
        </form>
      </div>
    </section>
  );
}
export default CreateTravelRequestForm;

/*
Modification History:

- 2026-02-26 | Santiago Arista | Added file description, JSDoc documentation, and translated validation messages to English.
- 2026-04-29 | Fabrizio | Added currency selector and real-time conversion logic for advance money.
*/