// Tests de la logique du formulaire de plan de lecture (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanPayload, imageUrlEnvoyee } from "./readingPlans.js";

const base = { title: " Plan ", scope: "WHOLE", books: new Set([1]), durationDays: "30", isActive: true };

test("image : l'URL est envoyée, vide ou retirée donne null", () => {
    assert.equal(imageUrlEnvoyee("https://api.exemple/media/a.png"), "https://api.exemple/media/a.png");
    assert.equal(imageUrlEnvoyee(""), null);
    assert.equal(imageUrlEnvoyee("  "), null);
    assert.equal(imageUrlEnvoyee(undefined), null);
});

test("charge utile : titre nettoyé, image retirée = null, livres seulement si SPECIFIC", () => {
    assert.deepEqual(buildPlanPayload({ ...base, imageUrl: "" }), {
        title: "Plan",
        imageUrl: null,
        scope: "WHOLE",
        bookNumbers: [],
        durationDays: 30,
        isActive: true,
    });
    const specifique = buildPlanPayload({ ...base, imageUrl: "https://x/y.png", scope: "SPECIFIC" });
    assert.equal(specifique.imageUrl, "https://x/y.png");
    assert.deepEqual(specifique.bookNumbers, [1]);
});
