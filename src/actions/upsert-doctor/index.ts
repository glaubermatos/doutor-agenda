"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { protectedActionClientWithClinic } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);

export const upsertDoctor = protectedActionClientWithClinic
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput, ctx }) => {
    const availableFromTime = parsedInput.availableFromTime; // 15:00:00
    const availableToTime = parsedInput.availableToTime; // 16:00:00

    // obtebdo a hora no formato UTC
    const availableFromTimeUtc = dayjs()
      .set("hour", parseInt(availableFromTime.split(":")[0]))
      .set("minute", parseInt(availableFromTime.split(":")[1]))
      .set("second", parseInt(availableFromTime.split(":")[2]))
      .utc();

    // obtebdo a hora no formato UTC
    const availableToTimeUtc = dayjs()
      .set("hour", parseInt(availableToTime.split(":")[0]))
      .set("minute", parseInt(availableToTime.split(":")[1]))
      .set("second", parseInt(availableToTime.split(":")[2]))
      .utc();

    await db
      .insert(doctorsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
        //converter os horarios para UTC
        availableFromTime: availableFromTimeUtc.format("HH:mm:ss"),
        availableToTime: availableToTimeUtc.format("HH:mm:ss"),
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
          //converter os horarios para UTC
          availableFromTime: availableFromTimeUtc.format("HH:mm:ss"),
          availableToTime: availableToTimeUtc.format("HH:mm:ss"),
        },
      });

    revalidatePath("/doctors");
  });
