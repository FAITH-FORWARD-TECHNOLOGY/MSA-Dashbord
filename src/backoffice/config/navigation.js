import { SUPER_ADMIN } from "../utils/permissions.js";

// Navigation groupée par thème : un menu déroulant par groupe.
export const navigation = [
    {
        name: "Membres",
        items: [
            { name: "Utilisateurs", href: "/users", code: "bo.utilisateurs.voir" },
            { name: "Cellules", href: "/cellules", code: "bo.cellules.voir" },
            { name: "Membres par quartier", href: "/membres-par-quartier", code: "bo.quartiers.voir" },
            { name: "Communes", href: "/communes", code: "bo.communes.voir" },
            { name: "Quartiers", href: "/quartiers", code: "bo.quartiers.voir" },
            { name: "Statistiques", href: "/statistiques", code: "bo.statistiques.voir" },
            { name: "Export des données", href: "/export-donnees", code: "bo.export_donnees.voir" },
        ],
    },
    {
        name: "Contenus",
        items: [
            { name: "Activités", href: "/activites", code: "bo.activites.voir" },
            { name: "Catégories", href: "/categorie", code: "bo.categories.voir" },
            { name: "Pays", href: "/pays", code: "bo.pays.voir" },
            { name: "Destinations", href: "/destinations", code: "bo.destinations.voir" },
        ],
    },
    {
        name: "Module Bible",
        items: [
            { name: "Plans", href: "/reading-plans", code: "bo.plans.voir" },
            { name: "Verset du jour", href: "/daily-verse", code: "bo.verset.voir" },
            { name: "Communication", href: "/communication", code: "bo.communication.voir" },
            { name: "Sujets de prière", href: "/sujets-de-priere", code: "bo.prieres.voir" },
        ],
    },
    {
        name: "Configuration",
        items: [{ name: "Version App", href: "/app-version", code: "bo.versions.voir" }],
    },
    // Réservé au super admin (serveur à rôles seulement).
    {
        name: "Administration",
        items: [
            { name: "Rôles et permissions", href: "/roles", code: SUPER_ADMIN },
            { name: "Journal", href: "/journal", code: SUPER_ADMIN },
        ],
    },
];
