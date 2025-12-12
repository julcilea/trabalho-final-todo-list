/**
 * Endpoints da API
 */
export const ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login'
    },
    TODO: '/todos'
};

/**
 * Headers padrão para requisições
 */
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};