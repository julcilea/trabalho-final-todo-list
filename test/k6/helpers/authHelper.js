import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './getBaseUrl.js';
import { generateRandomEmail, generateRandomPassword } from './generateRandomData.js';
import { ENDPOINTS, DEFAULT_HEADERS } from './apiCalls.js';

/**
 * Registra um novo usuário
 * @param {string} email - Email do usuário (opcional, gera um aleatório se não fornecido)
 * @param {string} password - Senha do usuário (opcional, gera uma aleatória se não fornecida)
 * @returns {object} Resposta da requisição de registro
 */
export function registerUser(email = null, password = null) {
    const baseUrl = getBaseUrl();
    const userEmail = email || generateRandomEmail();
    const userPassword = password || generateRandomPassword();

    const response = http.post(
        `${baseUrl}${ENDPOINTS.AUTH.REGISTER}`,
        JSON.stringify({
            email: userEmail,
            password: userPassword,
        }),
        {
            headers: DEFAULT_HEADERS,
        }
    );

    return { response, email: userEmail, password: userPassword };
}

/**
 * Faz login de um usuário e retorna o token
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {object} Objeto contendo a resposta e o token extraído
 */
export function loginUser(email, password) {
    const baseUrl = getBaseUrl();

    const response = http.post(
        `${baseUrl}${ENDPOINTS.AUTH.LOGIN}`,
        JSON.stringify({
            email: email,
            password: password,
        }),
        {
            headers: DEFAULT_HEADERS,
        }
    );

    const token = response.json('token');

    return { response, token };
}
