"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { protectedActionClientWithClinic } from "@/lib/next-safe-action";

export const deletePatiente = protectedActionClientWithClinic
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    //Usuário só pode deletar pacientes que pertence a clinica gerenciada por ele
    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.id),
    });

    if (!patient) {
      throw new Error("Paciente não encontrado.");
    }

    if (patient.clinicId !== ctx.user.clinic.id) {
      throw new Error("Paciente não encontrado");
    }

    // deleta o paciente na base de dados
    await db.delete(patientsTable).where(eq(patientsTable.id, parsedInput.id));

    revalidatePath("/patients");
  });
