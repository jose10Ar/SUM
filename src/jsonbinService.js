/**
 * jsonbinService.js
 * Servicio para interactuar con la API de JSONBin.io v3
 * Documentación: https://jsonbin.io/api-reference
 */

const BASE_URL = 'https://api.jsonbin.io/v3';

/**
 * Lee el contenido completo de un bin.
 * @param {string} binId  - ID del bin (ej: "68293abc...")
 * @param {string} apiKey - X-Master-Key o X-Access-Key de JSONBin
 * @returns {Promise<any>} - El objeto almacenado en el bin
 */
export async function readBin(binId, apiKey) {
    const res = await fetch(`${BASE_URL}/b/${binId}/latest`, {
        headers: {
            'X-Master-Key': apiKey,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status} al leer el bin`);
    }
    const data = await res.json();
    return data.record; // JSONBin devuelve { record: <tus datos>, metadata: {...} }
}

/**
 * Sobrescribe por completo el contenido de un bin.
 * @param {string} binId   - ID del bin
 * @param {string} apiKey  - X-Master-Key o X-Access-Key
 * @param {any}    payload - Dato a guardar (será serializado a JSON)
 * @returns {Promise<any>} - El objeto actualizado
 */
export async function writeBin(binId, apiKey, payload) {
    const res = await fetch(`${BASE_URL}/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status} al escribir el bin`);
    }
    const data = await res.json();
    return data.record;
}

/**
 * Crea un nuevo bin con el contenido inicial.
 * @param {string} apiKey      - X-Master-Key
 * @param {any}    initialData - Contenido inicial
 * @param {string} [name]      - Nombre descriptivo del bin (opcional)
 * @returns {Promise<{binId: string, record: any}>}
 */
export async function createBin(apiKey, initialData, name = 'SUM-Actividades') {
    const res = await fetch(`${BASE_URL}/b`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
            'X-Bin-Name': name,
            'X-Bin-Private': 'true',
        },
        body: JSON.stringify(initialData),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status} al crear el bin`);
    }
    const data = await res.json();
    return { binId: data.metadata.id, record: data.record };
}
