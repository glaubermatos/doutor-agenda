"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const createClinic = async (name: string) => {
  // verificar se o usuário esta logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Error("Unauthorized.");
  }

  // cria a clinica
  const result = await db.insert(clinicsTable).values({ name }).returning();
  const clinic = result[0];

  // associa a clinica ao usuário logado
  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
  });

  redirect("/dashboard");
};
