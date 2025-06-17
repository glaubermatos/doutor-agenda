"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { protectedActionClientWithClinic } from "@/lib/next-safe-action";

export const deleteAppoointment = protectedActionClientWithClinic
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // Usuário só pode deletar agendamentos que pertencem à clínica gerenciada por ele
    const appointment = await db.query.appointmentsTable.findFirst({
      where: eq(appointmentsTable.id, parsedInput.id),
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    if (appointment.clinicId !== ctx.user.clinic.id) {
      throw new Error("Agendamento não encontrado");
    }

    // Deleta o agendamento na base de dados
    await db
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, parsedInput.id));

    revalidatePath("/appointments");
  });
