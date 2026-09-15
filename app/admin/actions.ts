"use server";

import type { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isAdminAuthenticated, setAdminSession } from "@/lib/adminAuth";
import { deleteStoredCv } from "@/lib/cvStorage";
import { prisma } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/status";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }
}

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    redirect("/admin?error=missing");
  }

  if (typeof password !== "string" || password !== configuredPassword) {
    redirect("/admin?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}

export async function updateApplicationStatus(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string" || !(status in STATUS_LABELS)) {
    throw new Error("Mise à jour de statut invalide.");
  }

  await prisma.application.update({
    where: { id },
    data: { status: status as ApplicationStatus },
  });

  revalidatePath("/admin");
}

export async function deleteApplication(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Candidature invalide.");
  }

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    revalidatePath("/admin");
    return;
  }

  await prisma.application.delete({ where: { id } });
  await deleteStoredCv(application.cvStorageType, application.cvPath);

  revalidatePath("/admin");
}
