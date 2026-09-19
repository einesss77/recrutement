import type { CandidateCategory, CandidateRelevance, CandidateSeniority } from "@prisma/client";

export const CATEGORY_LABELS: Record<CandidateCategory, string> = {
  UNCLASSIFIED: "À classer",
  COMMERCIAL: "Commercial",
  FULL_STACK: "Dev full-stack",
  IA_DATA: "IA / Data",
  MOTION_DESIGN: "Motion design",
  ACCOUNT_PROJECT: "Account / Projet",
  JUNIOR_HORS_SUJET: "Junior hors sujet",
  OTHER: "Autre",
};

export const SENIORITY_LABELS: Record<CandidateSeniority, string> = {
  UNKNOWN: "Non renseigné",
  SORTIE_ECOLE: "Sortie d’école",
  JUNIOR: "Junior",
  CONFIRME: "Confirmé",
  SENIOR: "Senior",
};

export const RELEVANCE_LABELS: Record<CandidateRelevance, string> = {
  NON_EVALUE: "Non évalué",
  HORS_SUJET: "Hors sujet",
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  FORT: "Fort",
  TRES_INTERESSANT: "Très intéressant",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as CandidateCategory,
  label,
}));

export const SENIORITY_OPTIONS = Object.entries(SENIORITY_LABELS).map(([value, label]) => ({
  value: value as CandidateSeniority,
  label,
}));

export const RELEVANCE_OPTIONS = Object.entries(RELEVANCE_LABELS).map(([value, label]) => ({
  value: value as CandidateRelevance,
  label,
}));

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
