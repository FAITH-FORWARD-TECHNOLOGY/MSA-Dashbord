// Centralisation de l'URL de l'API NestJS — un seul endroit à modifier
// pour faire pointer le dashboard vers la PP ou la PROD.
//
// Le déploiement Coolify définit VITE_API_URL pour chaque environnement :
//   - PROD : VITE_API_URL=https://api-pr.mydigifinance.com  (dashboard msa-pr.mydigifinance.com)
//   - PP   : VITE_API_URL=https://api-msa.mydigifinance.com (env de test/preprod historique)
//
// La valeur de fallback pointe sur la PP — c'est volontaire : un dev qui
// clone le repo sans configurer .env doit retomber sur PP, pas sur PROD,
// pour éviter de manipuler des données réelles par accident.
export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://api-msa.mydigifinance.com";

// URL du service d'upload de fichiers. Le backend MSA n'expose pas (encore)
// d'endpoint d'upload : on s'appuie sur le service de fichiers partagé. Pilotée
// par VITE_FILE_UPLOAD_URL pour basculer sans modifier le code.
// Fallback = service historique (api-pp), comportement actuel préservé.
export const FILE_UPLOAD_URL =
    import.meta.env.VITE_FILE_UPLOAD_URL ||
    "https://api-pp.mydigifinance.com/api/v1/file-upload/single";

// En-tetes avec le Bearer token de l'admin connecte (stocke par useAuth dans
// localStorage.jobhubs_auth.user.token). Pour les endpoints proteges (plans,
// verset du jour), qui exigent un compte authentifie cote backend.
function lireJeton() {
    try {
        const stored = localStorage.getItem("jobhubs_auth");
        return stored ? (JSON.parse(stored)?.user?.token ?? "") : "";
    } catch {
        return "";
    }
}

export function authHeaders(extra = {}) {
    const token = lireJeton();
    return {
        accept: "*/*",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

// A appeler avec la reponse d'un fetch protege. Si le token est invalide/expire
// (401), on nettoie la session et on renvoie vers /login au lieu de laisser une
// page cassee avec un 401 muet. Retourne true si un 401 a ete gere.
export function handleUnauthorized(res) {
    if (res && res.status === 401) {
        try {
            localStorage.removeItem("jobhubs_auth");
        } catch {
            /* ignore */
        }
        if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
        }
        return true;
    }
    return false;
}

// Le backend exige un jeton sur toutes ses routes non publiques : tout appel
// fetch vers l'API qui n'en porte pas recoit celui de l'admin connecte.
export function installerJetonSurFetch() {
    if (typeof window === "undefined" || window.__msaFetchAvecJeton) return;
    const fetchNatif = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        const url = typeof input === "string" ? input : (input?.url ?? String(input));
        if (!url.startsWith(API_BASE_URL)) return fetchNatif(input, init);
        const headers = new Headers(
            init.headers ?? (input instanceof Request ? input.headers : undefined),
        );
        const token = lireJeton();
        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return fetchNatif(input, { ...init, headers });
    };
    window.__msaFetchAvecJeton = true;
}
