// Mot de passe défini par un admin : mêmes règles que le serveur (PATCH /users/:id/password).
export const MDP_MIN = 8;
// bcrypt ignore tout ce qui dépasse 72 octets.
export const MDP_OCTETS_MAX = 72;
const LIMITE = `${MDP_OCTETS_MAX} octets au plus (environ ${MDP_OCTETS_MAX} caractères sans accents)`;
export const LONGUEUR_GENEREE = 16;

// Jeux de caractères du générateur, sans les caractères ambigus (0/O, 1/l/I).
export const MINUSCULES = "abcdefghijkmnopqrstuvwxyz";
export const MAJUSCULES = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CHIFFRES = "23456789";
export const SYMBOLES = "!@#$%&*+-=?_";
const JEUX = [MINUSCULES, MAJUSCULES, CHIFFRES, SYMBOLES];

// Taille en octets UTF-8, comme la compte le serveur.
export const octets = (v = "") => new TextEncoder().encode(v).length;

// Règles affichées dans la modale, avec leur état pour la saisie courante.
export function reglesMotDePasse(mdp = "", confirmation = "") {
    return [
        {
            id: "longueur",
            libelle: `${MDP_MIN} caractères au moins, ${LIMITE}`,
            ok: mdp.length >= MDP_MIN && octets(mdp) <= MDP_OCTETS_MAX,
        },
        {
            id: "identiques",
            libelle: "Les deux saisies sont identiques",
            ok: mdp.length > 0 && mdp === confirmation,
        },
    ];
}

// Erreurs par champ, vides quand la saisie peut être envoyée.
export function erreursMotDePasse(mdp = "", confirmation = "") {
    let champ = "";
    if (!mdp) champ = "Saisissez un mot de passe.";
    else if (mdp.length < MDP_MIN) champ = `Au moins ${MDP_MIN} caractères.`;
    else if (octets(mdp) > MDP_OCTETS_MAX) champ = `Mot de passe trop long : ${LIMITE}.`;
    let conf = "";
    if (!confirmation) conf = "Confirmez le mot de passe.";
    else if (confirmation !== mdp) conf = "Les deux saisies ne sont pas identiques.";
    return { mdp: champ, confirmation: conf };
}

export const motDePasseValide = (mdp, confirmation) => {
    const e = erreursMotDePasse(mdp, confirmation);
    return !e.mdp && !e.confirmation;
};

// Entiers aléatoires de 32 bits tirés par le navigateur (Web Crypto).
const aleatoireNavigateur = (n) => globalThis.crypto.getRandomValues(new Uint32Array(n));

// Index uniforme dans [0, taille) : les tirages qui biaiseraient le modulo sont rejetés.
function tirerIndex(taille, aleatoire) {
    const plafond = Math.floor(0x100000000 / taille) * taille;
    for (;;) {
        const v = aleatoire(1)[0];
        if (v < plafond) return v % taille;
    }
}

// Mot de passe aléatoire : au moins un caractère de chaque jeu, positions mélangées.
export function genererMotDePasse(longueur = LONGUEUR_GENEREE, aleatoire = aleatoireNavigateur) {
    const n = Math.min(Math.max(longueur, Math.max(MDP_MIN, JEUX.length)), MDP_OCTETS_MAX);
    const tous = JEUX.join("");
    const car = JEUX.map((jeu) => jeu[tirerIndex(jeu.length, aleatoire)]);
    while (car.length < n) car.push(tous[tirerIndex(tous.length, aleatoire)]);
    // Mélange de Fisher-Yates.
    for (let i = car.length - 1; i > 0; i--) {
        const j = tirerIndex(i + 1, aleatoire);
        [car[i], car[j]] = [car[j], car[i]];
    }
    return car.join("");
}
