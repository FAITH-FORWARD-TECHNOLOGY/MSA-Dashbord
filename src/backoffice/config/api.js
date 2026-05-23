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
