import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';
import { loginUser } from './helpers/authHelper.js';
import { UserRegistration } from './helpers/userRegistration.js';

const users = new SharedArray('users', function () {
    return JSON.parse(open('./data/login-test-data.json'));
});

// Métricas customizadas
const loginDurationTrend = new Trend('login_duration_ms', false);

export let options = {
    vus: 7,
    iterations: 7,
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% das requests devem ser < 2s
    },
};

/**
 * Setup: Registra todos os usuários antes do teste
 */
export function setup() {
    return UserRegistration.registerUsers(users);
}

/**
 * Teste principal: Faz login com os usuários registrados
 */
export default function (registeredUsers) {
    group('LOGIN_PERFORMANCE', () => {
        const user = registeredUsers[(__VU - 1) % registeredUsers.length];

        const result = loginUser(user.email, user.password);
        const loginResponse = result.response;

        loginDurationTrend.add(loginResponse.timings.duration);

        check(loginResponse, {
            'login status 200': (r) => r.status === 200
        });
    });

    sleep(1);
}