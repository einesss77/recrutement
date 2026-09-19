import Link from "next/link";
import { Download, ExternalLink, LogOut, Trash2 } from "lucide-react";
import { deleteCandidateGroup, loginAdmin, logoutAdmin, updateCandidateReview } from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  normalizeEmail,
  RELEVANCE_LABELS,
  RELEVANCE_OPTIONS,
  SENIORITY_LABELS,
  SENIORITY_OPTIONS,
} from "@/lib/candidateReview";
import { prisma } from "@/lib/db";
import { offers } from "@/lib/offers";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/status";

type AdminPageProps = {
  searchParams: Promise<{
    job?: string;
    category?: string;
    relevance?: string;
    seniority?: string;
    q?: string;
    error?: string;
  }>;
};

type Application = Awaited<ReturnType<typeof prisma.application.findMany>>[number];

type CandidateGroup = {
  key: string;
  representative: Application;
  applications: Application[];
  submissionCount: number;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function groupApplications(applications: Application[]) {
  const groups = new Map<string, Application[]>();

  for (const application of applications) {
    const key = application.emailNormalized || normalizeEmail(application.email);
    groups.set(key, [...(groups.get(key) ?? []), application]);
  }

  return Array.from(groups.entries())
    .map(([key, groupApplications]) => {
      const sorted = groupApplications.sort(
        (left, right) =>
          new Date(right.lastSubmittedAt ?? right.createdAt).getTime() -
          new Date(left.lastSubmittedAt ?? left.createdAt).getTime(),
      );

      return {
        key,
        representative: sorted[0],
        applications: sorted,
        submissionCount: sorted.reduce((total, application) => total + application.duplicateCount, 0),
      };
    })
    .sort(
      (left, right) =>
        new Date(right.representative.lastSubmittedAt ?? right.representative.createdAt).getTime() -
        new Date(left.representative.lastSubmittedAt ?? left.representative.createdAt).getTime(),
    );
}

function candidateMatchesQuery(candidate: CandidateGroup, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    candidate.representative.fullName,
    candidate.representative.email,
    candidate.representative.phone,
    candidate.representative.candidateTags,
    candidate.representative.adminNotes,
    candidate.applications.map((application) => application.jobTitle).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { job, category, relevance, seniority, q, error } = await searchParams;
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
  const selectedCategory = category && category in CATEGORY_LABELS ? category : "";
  const selectedRelevance = relevance && relevance in RELEVANCE_LABELS ? relevance : "";
  const selectedSeniority = seniority && seniority in SENIORITY_LABELS ? seniority : "";
  const query = q?.trim() ?? "";

  const applications = await prisma.application.findMany({
    where: {
      ...(selectedJob ? { jobSlug: selectedJob } : {}),
      ...(selectedCategory ? { candidateCategory: selectedCategory as Application["candidateCategory"] } : {}),
      ...(selectedRelevance ? { candidateRelevance: selectedRelevance as Application["candidateRelevance"] } : {}),
      ...(selectedSeniority ? { candidateSeniority: selectedSeniority as Application["candidateSeniority"] } : {}),
    },
    orderBy: [{ lastSubmittedAt: "desc" }, { createdAt: "desc" }],
  });
  const candidates = groupApplications(applications).filter((candidate) => candidateMatchesQuery(candidate, query));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Gestion des candidatures</h1>
        </div>
        <form action={logoutAdmin}>
          <button className="icon-button" type="submit" title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </form>
      </header>

      <section className="admin-toolbar candidate-toolbar">
        <form>
          <label>
            <span>Offre</span>
            <select name="job" defaultValue={selectedJob}>
              <option value="">Toutes</option>
              {Object.values(offers).map((offer) => (
                <option key={offer.slug} value={offer.slug}>
                  {offer.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Famille</span>
            <select name="category" defaultValue={selectedCategory}>
              <option value="">Toutes</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Pertinence</span>
            <select name="relevance" defaultValue={selectedRelevance}>
              <option value="">Toutes</option>
              {RELEVANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Niveau</span>
            <select name="seniority" defaultValue={selectedSeniority}>
              <option value="">Tous</option>
              {SENIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Recherche</span>
            <input name="q" type="search" defaultValue={query} placeholder="Nom, tag, note..." />
          </label>
          <button type="submit">Filtrer</button>
        </form>
        <div className="admin-count">
          {candidates.length} candidat(s) unique(s) / {applications.length} ligne(s)
        </div>
      </section>

      <section className="applications-list">
        {candidates.length === 0 ? (
          <div className="empty-state">Aucune candidature ne correspond aux filtres.</div>
        ) : (
          candidates.map((candidate) => {
            const application = candidate.representative;
            const appliedJobs = Array.from(new Set(candidate.applications.map((item) => item.jobTitle)));

            return (
              <article className="application-card" id={`application-${application.id}`} key={candidate.key}>
                <div className="application-main">
                  <div>
                    <p className="application-job">{appliedJobs.join(" + ")}</p>
                    <h2>{application.fullName}</h2>
                    <p className="application-date">
                      Dernière candidature : {formatDate(application.lastSubmittedAt ?? application.createdAt)}
                    </p>
                  </div>
                  <div className="candidate-badges">
                    <span className="status-pill">{STATUS_LABELS[application.status]}</span>
                    <span className="status-pill">{CATEGORY_LABELS[application.candidateCategory]}</span>
                    {candidate.submissionCount > 1 ? (
                      <span className="duplicate-pill">{candidate.submissionCount} soumissions</span>
                    ) : null}
                  </div>
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
                    <dt>Pertinence</dt>
                    <dd>{RELEVANCE_LABELS[application.candidateRelevance]}</dd>
                  </div>
                  <div>
                    <dt>Niveau</dt>
                    <dd>{SENIORITY_LABELS[application.candidateSeniority]}</dd>
                  </div>
                  <div>
                    <dt>Prétention</dt>
                    <dd>{application.salaryExpectation} TND</dd>
                  </div>
                  <div>
                    <dt>Disponibilité</dt>
                    <dd>{application.availability}</dd>
                  </div>
                </dl>

                <details className="application-details">
                  <summary>Voir les candidatures et réponses</summary>
                  {candidate.applications.map((item) => (
                    <div className="candidate-history" key={item.id}>
                      <strong>
                        {item.jobTitle} · {formatDate(item.lastSubmittedAt ?? item.createdAt)}
                      </strong>
                      <p>{item.specificAnswer}</p>
                    </div>
                  ))}
                </details>

                <form className="candidate-review-form" action={updateCandidateReview}>
                  <input name="emailKey" type="hidden" value={candidate.key} />
                  <label>
                    <span>Statut</span>
                    <select name="status" defaultValue={application.status}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Famille</span>
                    <select name="candidateCategory" defaultValue={application.candidateCategory}>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Niveau</span>
                    <select name="candidateSeniority" defaultValue={application.candidateSeniority}>
                      {SENIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Pertinence</span>
                    <select name="candidateRelevance" defaultValue={application.candidateRelevance}>
                      {RELEVANCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wide-field">
                    <span>Tags</span>
                    <input
                      name="candidateTags"
                      type="text"
                      defaultValue={application.candidateTags}
                      placeholder="dev ia, full-stack, commercial chasse..."
                    />
                  </label>
                  <label className="wide-field">
                    <span>Notes internes</span>
                    <textarea
                      name="adminNotes"
                      rows={3}
                      defaultValue={application.adminNotes}
                      placeholder="Pourquoi il est intéressant, points faibles, prochain contact..."
                    />
                  </label>
                  <button type="submit">Enregistrer la qualification</button>
                </form>

                <div className="application-actions">
                  <a className="secondary-action" href={`/admin/cv/${application.id}`}>
                    <Download size={17} aria-hidden="true" />
                    CV récent
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
                  <form action={deleteCandidateGroup}>
                    <input name="emailKey" type="hidden" value={candidate.key} />
                    <button className="danger-button" type="submit">
                      <Trash2 size={17} aria-hidden="true" />
                      Supprimer le candidat
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </section>

      <footer className="admin-footer">
        <Link href="/business-developer-it">Retour à la page modèle</Link>
      </footer>
    </main>
  );
}
