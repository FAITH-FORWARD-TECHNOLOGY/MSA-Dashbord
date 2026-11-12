// Tests de la logique pure de la répartition par quartier (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    CLE_COMMUNE_SEULE,
    CLE_NON_RENSEIGNE,
    TOUS,
    clesDepliables,
    filtrerParQuartier,
    libelleLieu,
    libelleMembres,
    libellePart,
    lieuDuMembre,
    lignesRepartition,
    nomComplet,
    nomFichierRepartition,
    optionsQuartiers,
    ouvertureInitiale,
    parametresMembres,
    partDe,
    trierParMembres,
} from "./repartition.js";

const q = (id, nom, membres, plus = {}) => ({ id, nom, membres, enAttente: false, nonRenseigne: false, ...plus });
const PAYS = [
    {
        id: 2,
        nom: "Sénégal",
        membres: 1,
        aucunLieu: 0,
        communes: [{ id: 24, nom: "Plateau", libelle: "Plateau", membres: 1, quartiers: [q(null, "Quartier non renseigné", 1, { nonRenseigne: true })] }],
    },
    {
        id: 1,
        nom: "Côte d'Ivoire",
        membres: 9,
        aucunLieu: 0,
        communes: [
            { id: 22, nom: "Plateau", libelle: "Plateau (Abidjan)", membres: 1, quartiers: [q(40, "Indénié", 1)] },
            {
                id: 20,
                nom: "Cocody",
                libelle: "Cocody",
                membres: 8,
                quartiers: [q(30, "Riviera 2", 1), q(null, "Quartier non renseigné", 2, { nonRenseigne: true }), q(31, "Angré", 5, { enAttente: true })],
            },
        ],
    },
    { id: 0, nom: "Pays non renseigné", membres: 4, aucunLieu: 4, communes: [] },
];

test("tri : membres décroissants puis ordre alphabétique, sans modifier l'entrée", () => {
    const entree = [{ nom: "b", membres: 1 }, { nom: "Éa", membres: 1 }, { nom: "c", membres: 3 }];
    assert.deepEqual(trierParMembres(entree).map((n) => n.nom), ["c", "b", "Éa"]);
    assert.equal(entree[0].nom, "b");
    assert.deepEqual(trierParMembres(undefined), []);
});

test("arbre replié : une ligne par pays, triées par membres", () => {
    const lignes = lignesRepartition(PAYS, new Set());
    assert.deepEqual(lignes.map((l) => [l.type, l.libelle, l.membres]), [
        ["pays", "Côte d'Ivoire", 9],
        ["pays", "Pays non renseigné", 4],
        ["pays", "Sénégal", 1],
    ]);
    assert.ok(lignes.every((l) => l.depliable && !l.ouvert));
});

test("arbre : pays ouverts par défaut, communes repliées et triées", () => {
    const lignes = lignesRepartition(PAYS, ouvertureInitiale(PAYS));
    assert.deepEqual(lignes.map((l) => `${l.niveau}:${l.libelle}`), [
        "0:Côte d'Ivoire",
        "1:Cocody",
        "1:Plateau (Abidjan)",
        "0:Pays non renseigné",
        "1:Aucun lieu renseigné",
        "0:Sénégal",
        "1:Plateau",
    ]);
});

test("arbre déplié : quartiers triés, en attente, quartier non renseigné, cibles", () => {
    const lignes = lignesRepartition(PAYS, new Set(clesDepliables(PAYS)));
    const cocody = lignes.filter((l) => l.cle.startsWith("p1/c20/"));
    assert.deepEqual(cocody.map((l) => [l.libelle, l.membres, l.enAttente, l.cible.zoneId]), [
        ["Angré", 5, true, 31],
        ["Quartier non renseigné", 2, false, 20],
        ["Riviera 2", 1, false, 30],
    ]);
    assert.equal(cocody[0].cible.titre, "Angré — Cocody");
    const aucun = lignes.find((l) => l.type === "aucun-lieu");
    assert.deepEqual(aucun.cible, { sansLieu: true, titre: "Aucun lieu renseigné" });
    // Clés uniques (clé React).
    assert.equal(new Set(lignes.map((l) => l.cle)).size, lignes.length);
});

test("arbre vide ou absent : aucune ligne", () => {
    assert.deepEqual(lignesRepartition([], new Set()), []);
    assert.deepEqual(lignesRepartition(undefined, new Set()), []);
    assert.deepEqual(clesDepliables(undefined), []);
});

test("libellés : part, pluriel, nom complet, fichier", () => {
    assert.equal(partDe(1, 4), 25);
    assert.equal(partDe(3, 0), 0);
    assert.equal(libellePart(1, 8).replace(/\s/g, " "), "12,5 %");
    assert.equal(libellePart(0, 0), "—");
    assert.equal(libelleMembres(1), "1 membre");
    assert.equal(libelleMembres(0), "0 membre");
    assert.equal(libelleMembres(12), "12 membres");
    assert.equal(nomComplet({ prenom: "Awa", nom: "Koné" }), "Awa Koné");
    assert.equal(nomComplet({ prenom: null, nom: "Koné" }), "Koné");
    assert.equal(nomFichierRepartition(new Date(2026, 10, 2)), "repartition-quartiers-msa_2026-11-02.xlsx");
});

const MEMBRES = [
    { id: 1, nom: "A", zone: { id: 30, nom: "Riviera 2", type: "QUARTIER", statut: "VALIDE", parent: { nom: "Cocody" } } },
    { id: 2, nom: "B", zone: { id: 31, nom: "Angré", type: "QUARTIER", statut: "A_VALIDER", parent: { nom: "Cocody" } } },
    { id: 3, nom: "C", zone: { id: 31, nom: "Angré", type: "QUARTIER", statut: "A_VALIDER", parent: { nom: "Cocody" } } },
    { id: 4, nom: "D", zone: { id: 20, nom: "Cocody", type: "COMMUNE", statut: "VALIDE", parent: { nom: "Abidjan" } } },
    { id: 5, nom: "E", zone: null },
    { id: 6, nom: "F" },
];

test("lieu d'un membre : quartier, commune seule, non renseigné", () => {
    assert.deepEqual(lieuDuMembre(MEMBRES[1]), { cle: "q31", libelle: "Angré", detail: "Cocody", enAttente: true });
    assert.equal(libelleLieu(lieuDuMembre(MEMBRES[0])), "Riviera 2 (Cocody)");
    assert.equal(libelleLieu(lieuDuMembre(MEMBRES[3])), "Commune seule (Cocody)");
    assert.equal(libelleLieu(lieuDuMembre(MEMBRES[4])), "Non renseigné");
    assert.equal(lieuDuMembre(MEMBRES[5]).cle, CLE_NON_RENSEIGNE);
});

test("filtre par quartier : options triées, quartier à un seul membre", () => {
    assert.deepEqual(optionsQuartiers(MEMBRES), [
        { cle: "q31", nom: "Angré (Cocody)", membres: 2 },
        { cle: "q30", nom: "Riviera 2 (Cocody)", membres: 1 },
        { cle: CLE_COMMUNE_SEULE, nom: "Commune seule", membres: 1 },
        { cle: CLE_NON_RENSEIGNE, nom: "Non renseigné", membres: 2 },
    ]);
    assert.deepEqual(filtrerParQuartier(MEMBRES, "q30").map((m) => m.id), [1]);
    assert.deepEqual(filtrerParQuartier(MEMBRES, CLE_COMMUNE_SEULE).map((m) => m.id), [4]);
    assert.deepEqual(filtrerParQuartier(MEMBRES, CLE_NON_RENSEIGNE).map((m) => m.id), [5, 6]);
    assert.equal(filtrerParQuartier(MEMBRES, TOUS).length, 6);
    assert.equal(filtrerParQuartier(MEMBRES, "q999").length, 0);
});

test("cellule sans aucun quartier renseigné : une seule option « Non renseigné »", () => {
    const membres = [{ id: 1 }, { id: 2, zone: null }];
    assert.deepEqual(optionsQuartiers(membres), [{ cle: CLE_NON_RENSEIGNE, nom: "Non renseigné", membres: 2 }]);
    assert.deepEqual(optionsQuartiers([]), []);
    assert.deepEqual(filtrerParQuartier(undefined, "q1"), []);
});

test("paramètres de la liste des membres : un seul critère, pays pour « commune seule »", () => {
    assert.deepEqual(parametresMembres({ zoneId: 30 }, { paysId: 1, celluleIds: "4", page: 2 }), {
        zoneId: 30, sansLieu: undefined, communeSeule: undefined, paysId: undefined, celluleIds: "4", page: 2,
    });
    assert.deepEqual(parametresMembres({ sansLieu: true }, { paysId: 1 }), {
        zoneId: undefined, sansLieu: "true", communeSeule: undefined, paysId: undefined, celluleIds: undefined, page: undefined,
    });
    assert.equal(parametresMembres({ communeSeule: true }, { paysId: 0 }).paysId, 0);
    assert.equal(parametresMembres({ communeSeule: true }, { paysId: "" }).paysId, undefined);
});
