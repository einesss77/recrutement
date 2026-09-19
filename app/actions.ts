"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/candidateReview";
import { storeCv } from "@/lib/cvStorage";
import { sendApplicationNotification } from "@/lib/email";
import { offers } from "@/lib/offers";

const MAX_CV_SIZE = 4 * 1024 * 1024;

function requiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Champ requis invalide: ${key}`);
  }

  return value.trim();
}

function optionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export async function submitApplication(formData: FormData) {
  const { prisma } = await import("@/lib/db");
  const jobSlug = requiredText(formData, "jobSlug");
  const offer = offers[jobSlug];

  if (!offer) {
    throw new Error("Offre introuvable.");
  }

  if (formData.get("consent") !== "on") {
    throw new Error("Le consentement est obligatoire.");
  }

  const salaryExpectation = Number.parseInt(requiredText(formData, "salaryExpectation"), 10);
  if (!Number.isFinite(salaryExpectation) || salaryExpectation < 0) {
    throw new Error("La prétention en TND est invalide.");
  }

  const cv = formData.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    throw new Error("Le CV est obligatoire.");
  }

  const originalName = cv.name || "cv.pdf";
  const isPdf = cv.type === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    throw new Error("Le CV doit être un fichier PDF.");
  }

  if (cv.size > MAX_CV_SIZE) {
    throw new Error("Le CV ne doit pas dépasser 4 Mo.");
  }

  const storedCv = await storeCv(cv);
  const email = requiredText(formData, "email");
  const emailNormalized = normalizeEmail(email);
  const existingApplication = await prisma.application.findFirst({
    where: {
      jobSlug,
      OR: [{ emailNormalized }, { email: { equals: email, mode: "insensitive" } }],
    },
    orderBy: { createdAt: "asc" },
  });

  const applicationData = {
      jobSlug,
      jobTitle: offer.title,
      fullName: requiredText(formData, "fullName"),
      email,
      emailNormalized,
      phone: requiredText(formData, "phone"),
      collaborationType: requiredText(formData, "collaborationType"),
      salaryExpectation,
      availability: requiredText(formData, "availability"),
      workOrganization: requiredText(formData, "workOrganization"),
      professionalLink: optionalText(formData, "professionalLink"),
      specificAnswer: requiredText(formData, "specificAnswer"),
      cvOriginalName: storedCv.originalName,
      cvStoredName: storedCv.storedName,
      cvPath: storedCv.path,
      cvStorageType: storedCv.storageType,
      cvMimeType: storedCv.mimeType,
      cvSize: storedCv.size,
      lastSubmittedAt: new Date(),
  };

  const application = existingApplication
    ? await prisma.application.update({
        where: { id: existingApplication.id },
        data: {
          ...applicationData,
          duplicateCount: { increment: 1 },
        },
      })
    : await prisma.application.create({
        data: applicationData,
      });

  await sendApplicationNotification({
    id: application.id,
    jobTitle: application.jobTitle,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    salaryExpectation: application.salaryExpectation,
    availability: application.availability,
    collaborationType: application.collaborationType,
    specificAnswer: application.specificAnswer,
  }).catch((error) => {
    console.error("Erreur lors de l'envoi de la notification e-mail", error);
  });

  redirect(`/${jobSlug}/merci`);
}
