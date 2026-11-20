import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";
import { messageErreur } from "./useStatistiques";
import { proposerFichier } from "./useReferentiel";

// Import d'utilisateurs par CSV : POST /users/import (admin).
async function appel(chemin, options) {
    let res;
    try {
        res = await fetch(`${API_BASE_URL}${chemin}`, options);
    } catch {
        throw new Error("Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.");
    }
    if (handleUnauthorized(res)) throw new Error("Session expirée. Reconnectez-vous.");
    if (!res.ok) throw new Error(await messageErreur(res));
    return res;
}

export async function telechargerModeleUtilisateurs() {
    const res = await appel("/users/import/modele", { headers: authHeaders({ accept: "*/*" }) });
    proposerFichier(await res.blob(), "modele-import-utilisateurs.csv");
}

// Envoi du fichier et des choix ; le mot de passe ne part que dans ce formulaire.
export async function envoyerImportUtilisateurs(fichier, { celluleId, paysId, motDePasse }) {
    const corps = new FormData();
    corps.append("celluleId", String(celluleId));
    corps.append("paysId", String(paysId));
    corps.append("motDePasse", motDePasse);
    corps.append("fichier", fichier);
    // Pas de Content-Type : le navigateur pose la frontière multipart.
    const { "Content-Type": _json, ...entetes } = authHeaders();
    const res = await appel("/users/import", { method: "POST", headers: entetes, body: corps });
    return res.json();
}
