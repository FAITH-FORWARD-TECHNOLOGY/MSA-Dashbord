# JobHubs - Instructions pour les agents IA

## Vue d'ensemble du projet

JobHubs est une application React de backoffice pour la gestion d'artisans et d'utilisateurs. Le projet utilise Vite + React avec TypeScript partiel et Tailwind CSS pour le styling.

## Architecture principale

### Structure des composants

-   **Authentification simple** : Login basique avec `localStorage` (`jobhubs_auth`)
-   **Layout principal** : `MainLayout.jsx` avec `<Outlet />` pour React Router
-   **Navigation** : Barre de navigation centralisée dans `Header.jsx` avec gestion d'état actif
-   **Composants mixtes** : Combinaison `.jsx` (React) et `.tsx` (TypeScript) - respecter les extensions existantes

### Patterns de développement spécifiques

#### Gestion des états et API - **MODERNISÉ**

```jsx
// Nouveau pattern avec hooks personnalisés
import { useUsers } from "../hooks/useUsers";

const MyComponent = () => {
    const { users, loading, error, updateUser, deleteUser, refetch } =
        useUsers();

    const handleUpdate = async (id, data) => {
        try {
            await updateUser(id, data);
            // Pas de window.location.reload() - le hook gère automatiquement la mise à jour
        } catch (err) {
            console.error(err);
        }
    };
};
```

#### Hooks de gestion d'état disponibles

Tous les hooks sont dans `src/backoffice/hooks/` :

-   **useUsers** : CRUD pour utilisateurs avec `updateUser`, `deleteUser`, `createUser`
-   **useCategories** : CRUD pour catégories avec `updateCategorie`, `deleteCategorie`, `createCategorie`
-   **usePays** : CRUD pour pays avec `updatePays`, `deletePays`, `createPays`
-   **useActivites** : CRUD pour activités + `addPhotoToActivity`, `addExpertiseToActivity`

#### Structure des composants de liste

-   **Props standards** : `{ items, onUpdate, onDelete }` pour tous les composants de liste
-   **Modales d'édition** : État local avec `isEditModalOpen`, `isDeleteModalOpen`
-   **Gestion d'erreurs** : État `error` et `isLoading` dans chaque composant
-   **Callbacks** : Utiliser les fonctions des hooks plutôt que les appels API directs

#### Styling avec Tailwind

```jsx
// Pattern de classes conditionnelles utilisé
className={classNames(
    isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700",
    "rounded-md px-3 py-2 text-sm font-medium"
)}
```

### Configuration et outils

#### Scripts de développement

```bash
npm run dev      # Serveur de développement Vite
npm run build    # Build de production
npm run lint     # ESLint avec configuration moderne
npm run preview  # Aperçu du build
```

#### Dépendances clés

-   **UI** : `@headlessui/react` + `@heroicons/react` pour les composants
-   **Forms** : `react-hook-form` pour la gestion des formulaires
-   **Icons** : `lucide-react` en plus des Heroicons
-   **HTTP** : `axios` disponible mais `fetch` natif utilisé en pratique

#### Types TypeScript

Types définis dans `src/backoffice/types/user.ts` :

```typescript
type User = {
    id: number;
    nom: string;
    prenom: string;
    role: string;
    email: string;
    paysId: number;
    pays: Pays;
};
```

## Conventions importantes

### Structure des fichiers

-   **Composants** : `src/backoffice/components/`
-   **Pages** : `src/backoffice/pages/`
-   **Types** : `src/backoffice/types/`
-   **Hooks** : `src/backoffice/hooks/` - **NOUVEAU** : Hooks personnalisés pour la gestion d'état
-   **Alias** : `@/` configuré pour `./src`

### Navigation et routage

Routes principales définies dans `Header.jsx` :

-   `/users` - Gestion des utilisateurs
-   `/activites` - Gestion des activités
-   `/categorie` - Gestion des catégories
-   `/pays` - Gestion des pays

### URL de l'API

Base URL : `https://api-msa.mydigifinance.com/`

## Points d'intégration critiques

1. **Authentification** : Vérifier `localStorage.getItem("jobhubs_auth")` pour l'état de connexion
2. **Navigation active** : Utiliser `useLocation()` avec `startsWith()` pour les états actifs
3. **Gestion d'état moderne** : Utiliser les hooks personnalisés au lieu de `window.location.reload()`
4. **Gestion d'erreurs** : Chaque composant gère ses propres erreurs avec état local

## Conseils de développement

-   Respecter le mélange `.jsx`/`.tsx` existant selon les composants
-   Utiliser les composants Headless UI existants pour la cohérence
-   Suivre le pattern de modales avec états multiples (`isEditModalOpen`, `isDeleteModalOpen`)
-   Implémenter la navigation avec les patterns de `Header.jsx`
-   **UTILISER les hooks personnalisés** au lieu des appels API directs et `window.location.reload()`
