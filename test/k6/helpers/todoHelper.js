import http from 'k6/http';
import { getBaseUrl } from './getBaseUrl.js';
import { generateRandomTitle, generateRandomDescription } from './generateRandomData.js';
import { ENDPOINTS, DEFAULT_HEADERS } from './apiCalls.js';

/**
 * Cria um novo item na lista TODO
 * @param {string} token - Token JWT para autenticação
 * @param {string} title - Título do item TODO (opcional, gera um aleatório se não fornecido)
 * @param {string} description - Descrição do item TODO (opcional, gera uma aleatória se não fornecida)
 * @returns {object} Resposta da requisição
 */
export function createTodo(token, title = null, description = null) {
    const baseUrl = getBaseUrl();
    const todoTitle = title || generateRandomTitle();
    const todoDescription = description || generateRandomDescription();

    const response = http.post(
        `${baseUrl}${ENDPOINTS.TODO}`,
        JSON.stringify({
            title: todoTitle,
            description: todoDescription,
        }),
        {
            headers: {
                ...DEFAULT_HEADERS,
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    return response;
}
