"use server";

import type { ApplicationStatus, CandidateCategory, CandidateRelevance, CandidateSeniority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isAdminAuthenticated, setAdminSession } from "@/lib/adminAuth";
import { CATEGORY_LABELS, normalizeEmail, RELEVANCE_LABELS, SENIORITY_LABELS } from "@/lib/candidateReview";
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

export async function updateCandidateReview(formData: FormData) {
  await requireAdmin();

  const emailKey = formData.get("emailKey");
  const category = formData.get("candidateCategory");
  const seniority = formData.get("candidateSeniority");
  const relevance = formData.get("candidateRelevance");
  const tags = formData.get("candidateTags");
  const notes = formData.get("adminNotes");
  const status = formData.get("status");

  if (
    typeof emailKey !== "string" ||
    typeof category !== "string" ||
    typeof seniority !== "string" ||
    typeof relevance !== "string" ||
    typeof tags !== "string" ||
    typeof notes !== "string" ||
    typeof status !== "string" ||
    !(category in CATEGORY_LABELS) ||
    !(seniority in SENIORITY_LABELS) ||
    !(relevance in RELEVANCE_LABELS) ||
    !(status in STATUS_LABELS)
  ) {
    throw new Error("Qualification candidat invalide.");
  }

  const normalizedEmail = normalizeEmail(emailKey);

  await prisma.application.updateMany({
    where: {
      OR: [{ emailNormalized: normalizedEmail }, { email: { equals: normalizedEmail, mode: "insensitive" } }],
    },
    data: {
      candidateCategory: category as CandidateCategory,
      candidateSeniority: seniority as CandidateSeniority,
      candidateRelevance: relevance as CandidateRelevance,
      candidateTags: tags.trim(),
      adminNotes: notes.trim(),
      status: status as ApplicationStatus,
    },
  });

  revalidatePath("/admin");
}

export async function deleteCandidateGroup(formData: FormData) {
  await requireAdmin();

  const emailKey = formData.get("emailKey");
  if (typeof emailKey !== "string") {
    throw new Error("Candidat invalide.");
  }

  const normalizedEmail = normalizeEmail(emailKey);
  const applications = await prisma.application.findMany({
    where: {
      OR: [{ emailNormalized: normalizedEmail }, { email: { equals: normalizedEmail, mode: "insensitive" } }],
    },
  });

  for (const application of applications) {
    await prisma.application.delete({ where: { id: application.id } });
    await deleteStoredCv(application.cvStorageType, application.cvPath);
  }

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
