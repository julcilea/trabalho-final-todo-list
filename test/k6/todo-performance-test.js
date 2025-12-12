import { sleep, check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { registerUser, loginUser } from './helpers/authHelper.js';
import { createTodo } from './helpers/todoHelper.js';

// Trend para monitorar o tempo de duração das requests do POST /todos
const todoDurationTrend = new Trend('todo_request_duration', true);

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'], // Erros de requisição devem ser menores que 1%
        http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser menores que 2 segundos
        'todo_request_duration': ['p(95)<2000'], // 95% das requisições de TODO devem ser menores que 2 segundos
    },
    stages: [
        { duration: '3s', target: 10 }, //Ramp-up
        { duration: '15s', target: 10 },//Average
        { duration: '2s', target: 100 }, //Spike
        { duration: '3s', target: 100 }, //Spike
        { duration: '5s', target: 10 }, //Average
        { duration: '5s', target: 0 }, //Ramp-down
    ]
};

export default function () {
    // Group: REGISTRO
    let registerEmail;
    let registerPassword;
    let registerResponse;

    group('REGISTRATION', function () {
        const result = registerUser();
        registerEmail = result.email;
        registerPassword = result.password;
        registerResponse = result.response;

        check(registerResponse, {
            'registration status 201': (r) => r.status === 201,
        });
    });

    // Group: LOGIN
    let loginResponse;
    let authToken;

    group('LOGIN', function () {
        const result = loginUser(registerEmail, registerPassword);
        loginResponse = result.response;
        authToken = result.token;

        check(loginResponse, {
            'login status 200': (r) => r.status === 200,
            'login response has token': (r) => authToken !== null && authToken !== undefined,
        });
    });


    // Group: CRIAR TODO
    let todoResponse;

    group('CREATE TODO', function () {
        todoResponse = createTodo(authToken);

        // Registra a duração no Trend
        todoDurationTrend.add(todoResponse.timings.duration);

        check(todoResponse, {
            'todo creation status 201': (r) => r.status === 201,
            'todo response has id': (r) => {
                try {
                    const data = r.json();
                    return data && data.id !== null && data.id !== undefined;
                } catch {
                    return false;
                }
            },
            'todo response has title': (r) => {
                try {
                    const data = r.json();
                    return data && data.title !== null && data.title !== undefined;
                } catch {
                    return false;
                }
            },
        });
    });

    sleep(1);
}