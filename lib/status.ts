import type { ApplicationStatus } from "@prisma/client";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NOUVEAU: "Nouveau",
  A_ETUDIER: "À étudier",
  PRESELECTIONNE: "Présélectionné",
  ENTRETIEN: "Entretien",
  RETENU: "Retenu",
  REFUSE: "Refusé",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as ApplicationStatus,
  label,
}));
