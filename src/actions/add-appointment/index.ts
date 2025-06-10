"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";
import { addAppointmentSchema } from "./schema";

export const addAppointment = actionClient
  .schema(addAppointmentSchema)
  .action(async ({ parsedInput }) => {
    // Recupera a sessão do usuário autenticado a partir dos headers
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Verifica se o usuário está autenticado
    if (!session?.user) {
      throw new Error("Unauthorized"); // Lança erro se não estiver autenticado
    }

    // Verifica se o usuário está vinculado a uma clínica
    if (!session.user.clinic?.id) {
      throw new Error("Clinica não encontrada"); // Lança erro se não tiver clínica associada
    }

    // Busca os horários disponíveis para o médico na data fornecida
    // usando a server action getAvailableTimes
    const availableTimes = await getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: dayjs(parsedInput.date).format("YYYY-MM-DD"),
    });

    // Verifica se a resposta da API contém dados
    // caso availableTimes.data seja undefined ou null, lança um erro.
    if (!availableTimes?.data) {
      throw new Error("No available times"); // Lança erro se não houver horários disponíveis para o médico e data informados
    }

    // Verifica se o horário solicitado ainda está disponível
    const isTimeAvailable = availableTimes.data?.some(
      (time) => time.value === parsedInput.time && time.available, // Compara horário e verifica se está disponível
    );

    // Lança erro caso o horário solicitado não esteja mais disponível
    if (!isTimeAvailable) {
      throw new Error("Time not available");
    }

    // Constrói a data completa do agendamento com hora e minuto informados
    const appointmentDateTime = dayjs(parsedInput.date)
      .set("hour", parseInt(parsedInput.time.split(":")[0]))
      .set("minute", parseInt(parsedInput.time.split(":")[1]))
      .toDate();

    // Insere um novo agendamento no banco de dados
    await db.insert(appointmentsTable).values({
      ...parsedInput,
      clinicId: session.user.clinic.id,
      date: appointmentDateTime, // Define a data e hora do agendamento
    });

    // Revalida (recarrega) a página de agendamentos no cache do Next.js
    revalidatePath("/appointments");
    //  // Revalida (recarrega) a página do dashboard no cache do Next.js
    revalidatePath("/dashboard");
  });
