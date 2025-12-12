/**
 * Obtém a URL base do servidor a partir das variáveis de ambiente
 * Pode ser passada via linha de comando com: --env BASE_URL=http://localhost:3000
 * @returns {string} A URL base configurada
 */
export function getBaseUrl() {
    return __ENV.BASE_URL || 'http://localhost:3000';
}
