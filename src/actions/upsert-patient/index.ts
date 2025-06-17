"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { doctorsTable, patientsTable } from "@/db/schema";
import { protectedActionClientWithClinic } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = protectedActionClientWithClinic
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .insert(patientsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
        },
      });

    revalidatePath("/patients");
  });
