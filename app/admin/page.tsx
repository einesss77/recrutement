import Link from "next/link";
import { Download, ExternalLink, LogOut, Trash2 } from "lucide-react";
import { deleteApplication, loginAdmin, logoutAdmin, updateApplicationStatus } from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { offers } from "@/lib/offers";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/status";

type AdminPageProps = {
  searchParams: Promise<{ job?: string; error?: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { job, error } = await searchParams;
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login" action={loginAdmin}>
          <p className="eyebrow">Administration</p>
          <h1>Candidatures B&M Digital Consulting</h1>
          <label>
            <span>Mot de passe</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error === "missing" ? (
            <p className="form-error">Configurez ADMIN_PASSWORD dans le fichier .env.</p>
          ) : null}
          {error === "1" ? <p className="form-error">Mot de passe incorrect.</p> : null}
          <button type="submit">Se connecter</button>
        </form>
      </main>
    );
  }

  const selectedJob = job && offers[job] ? job : "";
  const applications = await prisma.application.findMany({
    where: selectedJob ? { jobSlug: selectedJob } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Candidatures</h1>
        </div>
        <form action={logoutAdmin}>
          <button className="icon-button" type="submit" title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </form>
      </header>

      <section className="admin-toolbar">
        <form>
          <label>
            <span>Filtrer par offre</span>
            <select name="job" defaultValue={selectedJob}>
              <option value="">Toutes les offres</option>
              {Object.values(offers).map((offer) => (
                <option key={offer.slug} value={offer.slug}>
                  {offer.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Filtrer</button>
        </form>
        <div className="admin-count">{applications.length} candidature(s)</div>
      </section>

      <section className="applications-list">
        {applications.length === 0 ? (
          <div className="empty-state">Aucune candidature pour le moment.</div>
        ) : (
          applications.map((application) => (
            <article className="application-card" id={`application-${application.id}`} key={application.id}>
              <div className="application-main">
                <div>
                  <p className="application-job">{application.jobTitle}</p>
                  <h2>{application.fullName}</h2>
                  <p className="application-date">{formatDate(application.createdAt)}</p>
                </div>
                <span className="status-pill">{STATUS_LABELS[application.status]}</span>
              </div>

              <dl className="application-meta">
                <div>
                  <dt>E-mail</dt>
                  <dd>
                    <a href={`mailto:${application.email}`}>{application.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Téléphone</dt>
                  <dd>{application.phone}</dd>
                </div>
                <div>
                  <dt>Collaboration</dt>
                  <dd>{application.collaborationType}</dd>
                </div>
                <div>
                  <dt>Prétention</dt>
                  <dd>{application.salaryExpectation} TND</dd>
                </div>
                <div>
                  <dt>Disponibilité</dt>
                  <dd>{application.availability}</dd>
                </div>
                <div>
                  <dt>Organisation</dt>
                  <dd>{application.workOrganization}</dd>
                </div>
              </dl>

              <details className="application-details">
                <summary>Voir la réponse complète</summary>
                <p>{application.specificAnswer}</p>
              </details>

              <div className="application-actions">
                <a className="secondary-action" href={`/admin/cv/${application.id}`}>
                  <Download size={17} aria-hidden="true" />
                  CV
                </a>
                {application.professionalLink ? (
                  <a
                    className="secondary-action"
                    href={application.professionalLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    Lien
                  </a>
                ) : null}
                <form action={updateApplicationStatus}>
                  <input name="id" type="hidden" value={application.id} />
                  <select name="status" defaultValue={application.status} aria-label="Statut">
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Modifier</button>
                </form>
                <form action={deleteApplication}>
                  <input name="id" type="hidden" value={application.id} />
                  <button className="danger-button" type="submit">
                    <Trash2 size={17} aria-hidden="true" />
                    Supprimer
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="admin-footer">
        <Link href="/business-developer-it">Retour à la page modèle</Link>
      </footer>
    </main>
  );
}
