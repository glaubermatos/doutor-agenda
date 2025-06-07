import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { addAppointment } from "@/actions/add-appointment";
import { getAvailableTimes } from "@/actions/get-available-times";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.string().min(1, { message: "Paciente é obrigatório" }),
  doctorId: z.string().min(1, { message: "Médico é obrigatório" }),
  appointmentPrice: z
    .number()
    .min(1, { message: "Valor da consulta é obrigatório" }),
  date: z.date({ message: "Data é obrigatório" }),
  time: z.string().min(1, { message: "Horário é obrigatório" }),
});

// interface AvailableTime {
//   value: string; // ex: "08:30:00"
//   available: boolean; // ex: true
//   label: string;
//   fullDateTime: string;
// }

interface UpsertAppointmentFormProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  onSucess?: () => void;
}

export const UpsertAppointmentForm = ({
  patients,
  doctors,
  onSucess,
}: UpsertAppointmentFormProps) => {
  const upsertForm = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentPrice: 0,
      date: undefined,
      time: "",
    },
  });

  const selectedDoctorId = upsertForm.watch("doctorId");
  const selectedPatientId = upsertForm.watch("patientId");
  const selectedDate = upsertForm.watch("date");

  const { data: availableTimes, isLoading } = useQuery({
    queryKey: ["available-times", selectedDate, selectedDoctorId],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
        doctorId: selectedDoctorId,
      }),
    enabled: !!selectedDate && !!selectedDoctorId,
  });

  const createAppointmentAction = useAction(addAppointment, {
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso.");
      onSucess?.();
    },
    onError: () => {
      toast.error("Erro ao criar agendamento");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAppointmentAction.execute({
      ...values,
      appointmentPriceInCents: values.appointmentPrice * 100,
    });
  };

  const isDateAvailable = (date: Date) => {
    if (!selectedDoctorId) return false;

    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === selectedDoctorId,
    );

    if (!selectedDoctor) return false;

    const dayOfWeek = date.getDay();

    return (
      dayOfWeek >= selectedDoctor.availableFromWeekDay &&
      dayOfWeek <= selectedDoctor.availableToWeekDay
    );
  };

  const isDateTimeEnabled = selectedPatientId && selectedDoctorId;

  // Atualizar o preço quando o médico for selecionado
  useEffect(() => {
    if (selectedDoctorId) {
      const selectedDoctor = doctors.find(
        (doctor) => doctor.id === selectedDoctorId,
      );

      if (selectedDoctor) {
        upsertForm.setValue(
          "appointmentPrice",
          selectedDoctor.appointmentsPriceInCents / 100,
        );
      }
    }
  }, [doctors, selectedDoctorId, upsertForm]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Agendar consulta</DialogTitle>
        <DialogDescription>Agende uma nova consulta.</DialogDescription>
      </DialogHeader>
      <Form {...upsertForm}>
        <form
          onSubmit={upsertForm.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={upsertForm.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={upsertForm.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o médico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={upsertForm.control}
            name="appointmentPrice"
            disabled={!selectedDoctorId}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.floatValue);
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  allowNegative={false}
                  allowLeadingZeros={false}
                  thousandSeparator="."
                  customInput={Input}
                  disabled={field.disabled}
                  prefix="R$ "
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={upsertForm.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      disabled={!isDateTimeEnabled}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      locale={ptBR}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < dayjs().subtract(1, "day").toDate() ||
                        !isDateAvailable(date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={upsertForm.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isDateTimeEnabled || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Carregando...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Selecione um horário" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimes?.data?.map((time) => (
                      <SelectItem
                        key={time.value}
                        value={time.value}
                        disabled={!time.available}
                      >
                        {time.label} {!time.available && "(Indisponível)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={createAppointmentAction.isPending}>
              {createAppointmentAction.isPending
                ? "Criando ..."
                : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};
