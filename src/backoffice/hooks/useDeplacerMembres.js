import { useState } from 'react';
import { API_BASE_URL } from '../config/api';

// POST /cellules/:id/membres/deplacer ; renvoie { deplaces, cible, ignores }.
export function useDeplacerMembres() {
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState('');

    const deplacer = async (celluleId, corps) => {
        setEnCours(true);
        setErreur('');
        try {
            const response = await fetch(`${API_BASE_URL}/cellules/${celluleId}/membres/deplacer`, {
                method: 'POST',
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
                body: JSON.stringify(corps),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
                throw new Error(message || `Erreur ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            setErreur(err.message || 'Le déplacement a échoué');
            throw err;
        } finally {
            setEnCours(false);
        }
    };

    return { deplacer, enCours, erreur, effacerErreur: () => setErreur('') };
}
