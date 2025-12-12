import { faker } from 'https://cdn.jsdelivr.net/npm/@faker-js/faker@8.3.1/+esm';

/**
 * Gera um email aleatório único para testes
 * Utiliza a biblioteca Faker para gerar emails realistas
 * @returns {string} Um email aleatório gerado pelo Faker
 */
export function generateRandomEmail() {
    return faker.internet.email();
}

/**
 * Gera uma senha aleatória realista usando Faker
 * @returns {string} Uma senha gerada pelo Faker
 */
export function generateRandomPassword() {
    return faker.internet.password({ length: 12, memorable: false });
}

/**
 * Gera um título aleatório realista para TODO usando Faker
 * @returns {string} Um título gerado pelo Faker
 */
export function generateRandomTitle() {
    return faker.commerce.productName();
}

/**
 * Gera uma descrição aleatória realista para TODO usando Faker
 * @returns {string} Uma descrição gerada pelo Faker
 */
export function generateRandomDescription() {
    return faker.commerce.productDescription();
}
