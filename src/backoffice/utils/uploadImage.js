import { API_BASE_URL, lireJeton } from '../config/api';

// Envoi d'une image sur le backend MSA (POST /communication/admin/uploads) ; renvoie son URL.
// Pas de Content-Type : le navigateur pose la frontière multipart.
export async function uploadImage(file) {
    const body = new FormData();
    body.append('file', file);
    const token = lireJeton();
    const response = await fetch(`${API_BASE_URL}/communication/admin/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 413) {
        throw new Error('Image trop lourde : 5 Mo maximum.');
    }
    if (!response.ok || !result.url) {
        throw new Error(result.message || `Échec de l'envoi (erreur ${response.status})`);
    }
    return result.url;
}
