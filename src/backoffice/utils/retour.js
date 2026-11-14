// Cible du bouton Retour : la page précédente si on vient du back-office, sinon la liste de repli.
// React Router donne la clé "default" à la première page chargée (lien direct, onglet neuf).
export function cibleRetour(cleLocation, repli) {
    return cleLocation && cleLocation !== "default" ? -1 : repli;
}
