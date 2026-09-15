import { Resend } from "resend";

type ApplicationNotification = {
  id: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  salaryExpectation: number;
  availability: string;
  collaborationType: string;
  specificAnswer: string;
};

export async function sendApplicationNotification(application: ApplicationNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO ?? "recrutement@bandmdigitalconsulting.com";
  const siteUrl = process.env.SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    console.warn("Notification e-mail ignorée: RESEND_API_KEY, EMAIL_FROM ou SITE_URL manquant.");
    return;
  }

  const resend = new Resend(apiKey);
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin#application-${application.id}`;

  await resend.emails.send({
    from,
    to,
    subject: `Nouvelle candidature – ${application.jobTitle} – ${application.fullName}`,
    text: [
      `Poste: ${application.jobTitle}`,
      `Nom: ${application.fullName}`,
      `E-mail: ${application.email}`,
      `Téléphone: ${application.phone}`,
      `Prétention en TND: ${application.salaryExpectation}`,
      `Disponibilité: ${application.availability}`,
      `Type de collaboration: ${application.collaborationType}`,
      "",
      "Réponse spécifique:",
      application.specificAnswer,
      "",
      `Candidature dans l'administration: ${adminUrl}`,
    ].join("\n"),
  });
}
