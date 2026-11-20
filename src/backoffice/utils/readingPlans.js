// Logique pure du formulaire de plan de lecture.

// Valeur d'image envoyée : l'URL, ou null si l'image est retirée / absente.
export const imageUrlEnvoyee = (imageUrl) => (imageUrl ?? "").trim() || null;

export function buildPlanPayload({ title, imageUrl, scope, books, durationDays, isActive }) {
    return {
        title: title.trim(),
        imageUrl: imageUrlEnvoyee(imageUrl),
        scope,
        bookNumbers: scope === "SPECIFIC" ? [...books] : [],
        durationDays: Number(durationDays),
        isActive,
    };
}
