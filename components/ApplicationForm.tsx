import { ArrowRight, FileText, Link as LinkIcon } from "lucide-react";
import { submitApplication } from "@/app/actions";
import type { Offer } from "@/lib/offers";

type ApplicationFormProps = {
  offer: Offer;
};

export function ApplicationForm({ offer }: ApplicationFormProps) {
  return (
    <form className="application-form" action={submitApplication}>
      <input name="jobSlug" type="hidden" value={offer.slug} />
      <div className="form-heading">
        <p>Candidature rapide</p>
        <h2>{offer.title}</h2>
      </div>

      <label>
        <span>Nom et prénom</span>
        <input name="fullName" type="text" autoComplete="name" required />
      </label>

      <div className="field-row">
        <label>
          <span>Adresse e-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Numéro de téléphone</span>
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
      </div>

      <label>
        <span>CV au format PDF</span>
        <div className="file-input">
          <FileText size={18} aria-hidden="true" />
          <input name="cv" type="file" accept="application/pdf" required />
        </div>
        <small>PDF uniquement, 4 Mo maximum.</small>
      </label>

      <div className="field-row">
        <label>
          <span>Type de collaboration</span>
          <select name="collaborationType" required defaultValue="">
            <option value="" disabled>
              Sélectionner
            </option>
            <option>Employé</option>
            <option>Freelance</option>
            <option>Ouvert aux deux</option>
          </select>
        </label>
        <label>
          <span>Prétention en TND</span>
          <input name="salaryExpectation" type="number" min="0" inputMode="numeric" required />
        </label>
      </div>

      <div className="field-row">
        <label>
          <span>Disponibilité</span>
          <select name="availability" required defaultValue="">
            <option value="" disabled>
              Sélectionner
            </option>
            <option>Immédiatement</option>
            <option>Sous 15 jours</option>
            <option>Sous un mois</option>
            <option>Plus d’un mois</option>
          </select>
        </label>
        <label>
          <span>Organisation souhaitée</span>
          <select name="workOrganization" required defaultValue="">
            <option value="" disabled>
              Sélectionner
            </option>
            <option>Télétravail</option>
            <option>Locaux de Tunis</option>
            <option>Les deux</option>
          </select>
        </label>
      </div>

      <label>
        <span>LinkedIn, portfolio ou GitHub</span>
        <div className="icon-input">
          <LinkIcon size={18} aria-hidden="true" />
          <input name="professionalLink" type="url" placeholder="https://" />
        </div>
      </label>

      <label>
        <span>{offer.specificQuestion}</span>
        <textarea name="specificAnswer" rows={5} required />
      </label>

      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>J’accepte le traitement de mes données dans le cadre de ma candidature.</span>
      </label>

      <button type="submit">
        Envoyer ma candidature
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
