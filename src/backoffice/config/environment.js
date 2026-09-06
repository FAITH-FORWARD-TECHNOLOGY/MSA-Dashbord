import { API_BASE_URL } from "./api";

// Marqueur d'environnement du back-office.
//
// Les deux instances partagent le meme code et ne different que par leur
// backend : sans repere visuel, on confond msa-pr (prod) et msa (preprod).
//
// La detection se fait sur l'URL de l'API pour ne rien avoir a configurer :
// seule la PROD pointe sur api-msa-prod. VITE_APP_ENV permet de forcer la
// valeur si les URLs changent ("prod" | "preprod" | "local").
const RAW_ENV = (import.meta.env.VITE_APP_ENV || "").trim().toLowerCase();

function detect() {
    if (RAW_ENV) return RAW_ENV;
    if (/^https?:\/\/localhost|127\.0\.0\.1|192\.168\./.test(API_BASE_URL)) {
        return "local";
    }
    return API_BASE_URL.includes("api-msa-prod") ? "prod" : "preprod";
}

export const APP_ENV = detect();
export const IS_PROD = APP_ENV === "prod";

// Libelle affiche a cote du titre. Null en prod : aucun bandeau parasite sur
// l'instance reelle, le marqueur ne sert qu'a signaler qu'on n'y est PAS.
export const ENV_LABEL = IS_PROD
    ? null
    : APP_ENV === "local"
      ? "LOCAL"
      : "PRÉPROD";

// Couleur du badge : orange pour la preprod, vert pour le local.
export const ENV_BADGE_CLASS =
    APP_ENV === "local"
        ? "bg-emerald-500 text-white"
        : "bg-amber-400 text-amber-950";
