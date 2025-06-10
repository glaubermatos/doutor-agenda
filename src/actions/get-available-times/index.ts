"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { generateTimeSlots } from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
    }),
  )
  .action(async ({ parsedInput }) => {
    // Autenticação e verificação de sessão
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session.user.clinic) {
      throw new Error("Clinica não encontrada.");
    }

    // Verificação se o médico existe
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });

    if (!doctor) {
      throw new Error("Medico não encontrado.");
    }

    // dia da semana selecionado pelo usuario: segunda, terça, quarta ...
    const selectedDayOfWeek = dayjs(parsedInput.date).day();

    // Verifica se o médico atende no dia da semana selecionado
    const doctorIsAvailableForSelectedDay =
      selectedDayOfWeek >= doctor.availableFromWeekDay &&
      selectedDayOfWeek <= doctor.availableToWeekDay;

    if (!doctorIsAvailableForSelectedDay) {
      return []; // sem disponibilidade de horários para a data selecionada
    }

    // Consulta os agendamentos do médico
    const appointmensOfDoctor = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, parsedInput.doctorId),
    });

    // Filtra os agendamentos somente para o dia solicitado.
    // Essa etapa tem o objetivo de filtrar os agendamentos (appointments) que já existem no banco para a data desejada e extrair os horários desses agendamentos.
    const appointmentsOnSelectedDate = appointmensOfDoctor
      .filter((appointment) => {
        return dayjs(appointment.date).isSame(parsedInput.date, "day");
      })
      .map((appointment) => dayjs(appointment.date).format("HH:mm:ss")); // terá um array com os horários já ocupados na data selecionada: ["09:00:00", "09:30:00", "10:00:00", ...]

    //gera horários de atendimento em intervalos fixos de 30 minutos a partir das 05:00 até as 23:00
    const timeSlots = generateTimeSlots({
      startTime: 5,
      endTime: 23,
      intervalMinutes: 30,
    });

    const doctorAvailableFrom = dayjs()
      .utc() // cria um objeto dayjs com base no horário atual, no fuso UTC
      .set("hour", Number(doctor.availableFromTime.split(":")[0])) // define a hora
      .set("minute", Number(doctor.availableFromTime.split(":")[1])) // define os minutos
      .set("second", 0) // zera os segundos
      .local(); // converte de volta para o horário local

    const doctorAvailableTo = dayjs()
      .utc()
      .set("hour", Number(doctor.availableToTime.split(":")[0]))
      .set("minute", Number(doctor.availableToTime.split(":")[1]))
      .set("second", 0)
      .local();

    // Você tem uma lista de horários gerados (ex: ["08:00", "08:30", "09:00", ...]) pela função generateTimeSlots(). Esses horários são genéricos e independentes da disponibilidade do médico.
    const doctorTimeSlots = timeSlots.filter((time) => {
      // Filtrar apenas os horários que estão dentro da janela de atendimento do médico (doctorAvailableFrom e doctorAvailableTo).
      const date = dayjs()
        .utc() // cria um objeto Dayjs baseado no tempo atual, em fuso UTC
        .set("hour", Number(time.split(":")[0]))
        .set("minute", Number(time.split(":")[1]))
        .set("second", 0);

      // a variável doctorTimeSlots conterá apenas os horários que o médico atende naquele dia, ignorando horários antes ou depois.
      return (
        date.format("HH:mm:ss") >= doctorAvailableFrom.format("HH:mm:ss") &&
        date.format("HH:mm:ss") <= doctorAvailableTo.format("HH:mm:ss")
      );

      //   return (
      //     !date.isBefore(doctorAvailableFrom) && !date.isAfter(doctorAvailableTo)
      //   );
    });

    return doctorTimeSlots.map((time) => {
      return {
        value: time,
        available: !appointmentsOnSelectedDate.includes(time),
        label: time.substring(0, 5),
      };
    });

    // return doctorTimeSlots.map((time) => {
    //   // O campo time é o horário completo, como "08:30:00"
    //   const fullDateTime = `${parsedInput.date}T${time}`; // Ex: "2025-06-06T08:30:00"

    //   return {
    //     value: time, // "08:30:00"
    //     // appointmentsOnSelectedDate contém todos os horários já agendados na data atual
    //     available: !appointmentsOnSelectedDate.includes(time), // Se o horário estiver agendado → `available: false` - Se estiver livre → `available: true`
    //     label: time.substring(0, 5), // HH:mm:ss -> HH:mm
    //     fullDateTime,
    //   };
    // });
  });
