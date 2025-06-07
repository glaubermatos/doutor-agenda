"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { doctorsTable, patientsTable } from "@/db/schema";

import { UpsertAppointmentForm } from "./upsert-appointment-form";

interface AddAppointmentsButtonProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export const AddAppointmentsButton = ({
  patients,
  doctors,
}: AddAppointmentsButtonProps) => {
  const [isUpsertAppointmentFormOpen, setIsUpsertAppointmentFormOpen] =
    useState(false);
  return (
    <Dialog
      open={isUpsertAppointmentFormOpen}
      onOpenChange={setIsUpsertAppointmentFormOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Adicionar agendamento
        </Button>
      </DialogTrigger>

      <UpsertAppointmentForm
        patients={patients}
        doctors={doctors}
        onSucess={() => setIsUpsertAppointmentFormOpen(false)}
      />
    </Dialog>
  );
};
