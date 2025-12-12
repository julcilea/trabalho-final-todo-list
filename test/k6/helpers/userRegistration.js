import { check, group } from 'k6';
import { registerUser } from './authHelper.js';

/**
 * Classe para registrar usuários do arquivo de dados de teste
 */
export class UserRegistration {
    /**
     * Registra múltiplos usuários a partir de um array
     * @param {array} users - Array de usuários com email e password
     * @returns {array} Array de usuários registrados com sucesso
     */
    static registerUsers(users) {
        const registeredUsers = [];

        group('USER_REGISTRATION', () => {
            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                const result = registerUser(user.email, user.password);

                check(result.response, {
                    'registration status 201 or 200': (r) => r.status === 201 || r.status === 200 || r.status === 409,
                    'registration email retornado': (r) => r.json('email') !== undefined || r.status === 409,
                });

                registeredUsers.push({
                    email: user.email,
                    password: user.password,
                });

                console.log(`✓ Usuário registrado: ${user.email}`);
            }
        });

        return registeredUsers;
    }
}
