// Tests de la logique pure du référentiel des lieux (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    CLASSE_A_CREER,
    CLASSE_ERREUR,
    CLASSE_EXISTANT,
    SANS_QUARTIER,
    candidatsFusion,
    classerApercu,
    compteursImport,
    corpsLieu,
    erreurFichier,
    erreurNom,
    IMPORTS,
    libelleFiltreQuartier,
    libelleLieuUtilisateur,
    libelleQuartier,
    libelleQuartiers,
    libelleStatut,
    libelleStatutLigne,
    libelleValidation,
    lieuUtilisateur,
    lignesVisibles,
    nettoyerNom,
    nombrePages,
    octetsDepuisBase64,
    parametresCommunes,
    parametresQuartiers,
    parametresRecherche,
    parametresRessemblants,
    parametresUtilisateurs,
    phraseFusion,
    quartierUtilisateur,
    ressemblantIdentique,
    tonStatut,
    trierPays,
} from "./referentiel.js";
import { chaineRequete } from "../components/statistiques/cellulesFiltre.js";

// Lignes d'aperçu au format du contrat (§ 8).
const LIGNES = [
    { ligne: 2, pays: "Côte d'Ivoire", commune: "Cocody", quartier: "Riviera 6", statut: "IMPORTE", raison: null },
    { ligne: 3, pays: "Côte d'Ivoire", commune: "Cocody", quartier: "Angré", statut: "IGNORE", raison: "Quartier déjà existant" },
    { ligne: 4, pays: "Côte d'Ivoire", commune: "Cocody", quartier: "Riviera 6", statut: "IGNORE", raison: "Doublon dans le fichier (ligne 2)" },
    { ligne: 5, pays: "Xyz", commune: "Cocody", quartier: "Test", statut: "REJETE", raison: "Pays « Xyz » inconnu" },
    { ligne: 7, pays: "Côte d'Ivoire", commune: "Abc", quartier: "Test", statut: "REJETE", raison: "Commune « Abc » inconnue dans le pays « Côte d'Ivoire »" },
    { ligne: 8, pays: "Côte d'Ivoire", commune: "Yopougon", quartier: "Niangon", statut: "IMPORTE", raison: null },
];
const RESUME = { lignesLues: 6, lignesVides: 1, importes: 2, ignores: 2, rejetes: 2 };

test("libellés : statut, pluriels", () => {
    assert.equal(libelleStatut("VALIDE"), "Validé");
    assert.equal(libelleStatut("A_VALIDER"), "En attente");
    assert.equal(tonStatut("A_VALIDER"), "ambre");
    assert.equal(tonStatut("VALIDE"), "vert");
    assert.equal(libelleQuartiers(0), "0 quartier");
    assert.equal(libelleQuartiers(1), "1 quartier");
    assert.equal(libelleQuartiers(41), "41 quartiers");
});

test("nom : nettoyé comme sur le serveur, 2 à 80 caractères", () => {
    assert.equal(nettoyerNom("  Riviera   2 \n"), "Riviera 2");
    assert.equal(erreurNom("   "), "Le nom est requis.");
    assert.equal(erreurNom("A"), "Nom : 2 à 80 caractères");
    assert.equal(erreurNom("x".repeat(81)), "Nom : 2 à 80 caractères");
    assert.equal(erreurNom("Ab"), "");
    assert.equal(erreurNom("x".repeat(80)), "");
});

test("communes : requête sans paramètre vide, page 1 implicite", () => {
    assert.equal(chaineRequete(parametresCommunes()), "?limite=50");
    assert.equal(
        chaineRequete(parametresCommunes({ paysId: "1", q: "  coco ", page: 2 })),
        "?paysId=1&q=coco&page=2&limite=50"
    );
    assert.equal(chaineRequete(parametresCommunes({ paysId: 3, page: 1 })), "?paysId=3&limite=50");
});

test("quartiers : filtres pays, commune, statut et recherche", () => {
    assert.equal(chaineRequete(parametresQuartiers()), "?limite=50");
    assert.equal(
        chaineRequete(parametresQuartiers({ paysId: "1", statut: "A_VALIDER", q: "riv" })),
        "?paysId=1&statut=A_VALIDER&q=riv&limite=50"
    );
    // La commune suffit : le pays n'est pas répété.
    assert.equal(
        chaineRequete(parametresQuartiers({ paysId: "1", communeId: "12", statut: "VALIDE", page: 3 })),
        "?communeId=12&statut=VALIDE&page=3&limite=50"
    );
    // Statut inconnu ignoré, limite de la fusion transmise.
    assert.equal(
        chaineRequete(parametresQuartiers({ communeId: 12, statut: "AUTRE", limite: 100 })),
        "?communeId=12&limite=100"
    );
});

test("recherche et ressemblants : paramètres du contrat", () => {
    assert.equal(chaineRequete(parametresRecherche({ q: " angre " })), "?q=angre");
    assert.equal(chaineRequete(parametresRecherche({ q: "riv", communeId: 12 })), "?q=riv&communeId=12");
    assert.deepEqual(parametresRessemblants({ communeId: 12, nom: " Rivera  2 " }), { communeId: "12", nom: "Rivera 2" });
    // Saisie incomplète : aucune requête.
    assert.equal(parametresRessemblants({ communeId: "", nom: "Rivera 2" }), null);
    assert.equal(parametresRessemblants({ communeId: 12, nom: "R" }), null);
});

test("pagination et tri des pays", () => {
    assert.equal(nombrePages(0, 50), 1);
    assert.equal(nombrePages(50, 50), 1);
    assert.equal(nombrePages(51, 50), 2);
    assert.equal(nombrePages(370), 8);
    assert.deepEqual(
        trierPays([{ id: 2, nom: "Sénégal" }, { id: 1, nom: "Côte d'Ivoire" }, { id: 3, nom: "bénin" }]).map((p) => p.id),
        [3, 1, 2]
    );
});

test("ressemblants : quartier identique repéré", () => {
    const liste = [
        { id: 1, nom: "Riviera 3", score: 0.8, identique: false },
        { id: 2, nom: "Riviera 2", score: 0.93, identique: true },
    ];
    assert.equal(ressemblantIdentique(liste).id, 2);
    assert.equal(ressemblantIdentique(liste.slice(0, 1)), null);
    assert.equal(ressemblantIdentique(undefined), null);
});

test("fusion : candidats de la même commune seulement, sans le quartier supprimé", () => {
    const source = { id: 900, nom: "Rivera 2", commune: { id: 12, nom: "Cocody" } };
    const quartiers = [
        source,
        { id: 345, nom: "Riviera 2", commune: { id: 12, nom: "Cocody" } },
        { id: 500, nom: "Riviera 2", commune: { id: 14, nom: "Yopougon" } },
    ];
    assert.deepEqual(candidatsFusion(quartiers, source).map((q) => q.id), [345]);
    assert.deepEqual(candidatsFusion(quartiers, null), []);
});

test("fusion : phrase de confirmation avec le nombre de membres", () => {
    const apercu = (n) => ({
        source: { id: 900, nom: "Rivera 2" },
        cible: { id: 345, nom: "Riviera 2" },
        commune: { id: 12, nom: "Cocody" },
        membresDeplaces: n,
    });
    assert.equal(phraseFusion(apercu(3)), "3 membres seront déplacés vers « Riviera 2 » (Cocody).");
    assert.equal(phraseFusion(apercu(1)), "1 membre sera déplacé vers « Riviera 2 » (Cocody).");
    assert.equal(phraseFusion(apercu(0)), "Aucun membre n'est rattaché à ce quartier.");
    assert.equal(phraseFusion(null), "");
});

test("import : Excel seul pour les communes, Excel ou CSV pour les quartiers", () => {
    assert.equal(IMPORTS.communes.bouton, "Importer (Excel)");
    assert.equal(IMPORTS.quartiers.bouton, "Importer (Excel ou CSV)");
    const f = (name, size = 1000) => ({ name, size });
    assert.equal(erreurFichier(f("communes.xlsx"), "communes"), "");
    assert.equal(erreurFichier(f("COMMUNES.XLSX"), "communes"), "");
    assert.match(erreurFichier(f("communes.csv"), "communes"), /Excel \(\.xlsx\) est attendu/);
    assert.equal(erreurFichier(f("quartiers.csv"), "quartiers"), "");
    assert.equal(erreurFichier(f("quartiers.xlsx"), "quartiers"), "");
    assert.match(erreurFichier(f("quartiers.pdf"), "quartiers"), /Excel \(\.xlsx\) ou CSV est attendu/);
    assert.equal(erreurFichier(f("vide.xlsx", 0), "communes"), "Fichier vide : aucune ligne à importer");
    assert.equal(erreurFichier(f("gros.xlsx", 2 * 1024 * 1024 + 1), "communes"), "Fichier trop volumineux (2 Mo au plus)");
    assert.equal(erreurFichier(f("limite.xlsx", 2 * 1024 * 1024), "communes"), "");
    assert.equal(erreurFichier(null, "communes"), "Choisissez un fichier.");
});

test("aperçu : lignes classées à créer / déjà existantes / en erreur", () => {
    const classes = classerApercu(LIGNES);
    assert.deepEqual(classes[CLASSE_A_CREER].map((l) => l.ligne), [2, 8]);
    assert.deepEqual(classes[CLASSE_EXISTANT].map((l) => l.ligne), [3, 4]);
    assert.deepEqual(classes[CLASSE_ERREUR].map((l) => l.ligne), [5, 7]);
    // Statut inconnu : traité comme une erreur, jamais comme une création.
    assert.deepEqual(classerApercu([{ ligne: 2, statut: "???" }])[CLASSE_ERREUR].length, 1);
    assert.deepEqual(classerApercu(undefined), { [CLASSE_A_CREER]: [], [CLASSE_EXISTANT]: [], [CLASSE_ERREUR]: [] });
    assert.equal(libelleStatutLigne(LIGNES[0]), "À créer");
    assert.equal(libelleStatutLigne(LIGNES[1]), "Déjà existant");
    assert.equal(libelleStatutLigne(LIGNES[3]), "En erreur");
});

test("aperçu : erreurs en tête, puis filtre par classe", () => {
    assert.deepEqual(lignesVisibles(LIGNES).map((l) => l.ligne), [5, 7, 3, 4, 2, 8]);
    assert.deepEqual(lignesVisibles(LIGNES, CLASSE_ERREUR).map((l) => l.ligne), [5, 7]);
    assert.deepEqual(lignesVisibles(LIGNES, CLASSE_A_CREER).map((l) => l.ligne), [2, 8]);
    assert.deepEqual(lignesVisibles(undefined), []);
});

test("aperçu : compteurs accordés (communes au féminin, quartiers au masculin)", () => {
    assert.deepEqual(
        compteursImport(RESUME, "communes").map((c) => `${c.nombre} ${c.libelle}`),
        ["2 à créer", "2 déjà existantes", "2 en erreur"]
    );
    assert.deepEqual(
        compteursImport({ importes: 1, ignores: 1, rejetes: 0 }, "quartiers").map((c) => `${c.nombre} ${c.libelle}`),
        ["1 à créer", "1 déjà existant", "0 en erreur"]
    );
    // Rapport final : le vocabulaire passe au passé.
    assert.deepEqual(
        compteursImport(RESUME, "communes", true).map((c) => `${c.nombre} ${c.libelle}`),
        ["2 créées", "2 ignorées (déjà existantes)", "2 en erreur"]
    );
    assert.deepEqual(compteursImport(undefined, "quartiers").map((c) => c.nombre), [0, 0, 0]);
});

test("aperçu : bouton de validation", () => {
    assert.equal(libelleValidation(RESUME, "communes"), "Importer 2 communes");
    assert.equal(libelleValidation({ importes: 1 }, "quartiers"), "Importer 1 quartier");
    assert.equal(libelleValidation({ importes: 0 }, "quartiers"), "Rien à importer");
});

test("rapport : octets du classeur renvoyé en base64", () => {
    assert.deepEqual([...octetsDepuisBase64("UEsDBA==")], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal(octetsDepuisBase64("").length, 0);
});

test("utilisateur : lieu lu dans `lieu`, sinon dans `zone`", () => {
    const avecLieu = {
        lieu: {
            pays: { id: 1, nom: "Côte d'Ivoire" },
            commune: { id: 12, nom: "Cocody" },
            quartier: { id: 345, nom: "Riviera 2", statut: "VALIDE" },
        },
    };
    assert.equal(libelleLieuUtilisateur(avecLieu), "Riviera 2, Cocody");
    assert.deepEqual(quartierUtilisateur(avecLieu), {
        id: 345,
        nom: "Riviera 2",
        statut: "VALIDE",
        commune: { id: 12, nom: "Cocody" },
    });

    const communeSeule = { lieu: { pays: null, commune: { id: 12, nom: "Cocody" }, quartier: null } };
    assert.equal(libelleLieuUtilisateur(communeSeule), "Cocody (commune seule)");
    assert.equal(quartierUtilisateur(communeSeule), null);

    // Ancien format : seule `zone` est servie.
    const zoneQuartier = {
        zone: { id: 345, nom: "Riviera 2", type: "QUARTIER", statut: "A_VALIDER", parent: { id: 12, nom: "Cocody", type: "COMMUNE" } },
    };
    assert.equal(libelleLieuUtilisateur(zoneQuartier), "Riviera 2, Cocody");
    assert.equal(lieuUtilisateur(zoneQuartier).quartier.statut, "A_VALIDER");
    assert.equal(libelleLieuUtilisateur({ zone: { id: 12, nom: "Cocody", type: "COMMUNE" } }), "Cocody (commune seule)");

    assert.equal(lieuUtilisateur({ lieu: null, zone: null }), null);
    assert.equal(libelleLieuUtilisateur({}), "");
    assert.equal(libelleQuartier({ nom: "Angré", commune: { nom: "Cocody" } }), "Angré, Cocody");
    assert.equal(libelleQuartier({ nom: "Angré" }), "Angré");
    assert.equal(libelleQuartier(null), "");
});

test("utilisateur : champs de lieu envoyés seulement si le quartier change", () => {
    const riviera = { id: 345, nom: "Riviera 2" };
    // Création : quartier choisi ou rien.
    assert.deepEqual(corpsLieu(riviera), { quartierId: 345 });
    assert.deepEqual(corpsLieu(null), {});
    // Modification : inchangé, remplacé, retiré.
    assert.deepEqual(corpsLieu(riviera, riviera), {});
    assert.deepEqual(corpsLieu({ id: 12 }, riviera), { quartierId: 12 });
    assert.deepEqual(corpsLieu(null, riviera), { communeId: null });
});

test("utilisateurs : filtre « Quartier » en paramètres de GET /users", () => {
    assert.equal(chaineRequete(parametresUtilisateurs(null)), "");
    assert.equal(chaineRequete(parametresUtilisateurs({ id: 345, nom: "Riviera 2" })), "?quartierId=345");
    assert.equal(chaineRequete(parametresUtilisateurs(SANS_QUARTIER)), "?sansQuartier=true");
    assert.equal(chaineRequete(parametresUtilisateurs({ id: "abc" })), "");
    assert.equal(libelleFiltreQuartier(SANS_QUARTIER), "Sans quartier renseigné");
    assert.equal(libelleFiltreQuartier({ nom: "Riviera 2", commune: { nom: "Cocody" } }), "Riviera 2, Cocody");
    assert.equal(libelleFiltreQuartier(null), "");
});
