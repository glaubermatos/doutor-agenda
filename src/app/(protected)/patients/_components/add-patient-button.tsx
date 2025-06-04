"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import { UpsertPatientForm } from "./upsert-patient-form";

export const AddPatientButton = () => {
  const [isDialogOpen, setIsOpenDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsOpenDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Adicionar paciente
        </Button>
      </DialogTrigger>

      <UpsertPatientForm
        isOpen={isDialogOpen}
        onSuccess={() => setIsOpenDialogOpen(false)}
      />
    </Dialog>
  );
};
