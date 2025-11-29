import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'], // Erros de requisição devem ser menores que 1%
        http_req_duration: ['p(90)<=3', 'p(95)<=4'], // 90% das requisições devem ser menores que 3ms
    }
};

export default function () {
    let responseLogin;
    let responseToDo;

    group('LOGIN', function () {
        responseLogin = http.post(
            'http://localhost:3000/auth/login',
            JSON.stringify({
                email: 'julcilea@teste.com.br',
                password: '123456',
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        //console.log('Response Body login:', responseLogin.body);

        check(responseLogin, {
            'login status 200': (r) => r.status === 200
        });
    });


    group('CRIAR TODO', function () {
        const token = responseLogin.json('token');

        responseToDo = http.post(
            'http://localhost:3000/todos',
            JSON.stringify({
                title: 'Lista de compras',
                description: 'Lista de compras do mês de dezembro',
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        //console.log('Response Body todo:', responseToDo.body);

        check(responseToDo, {
            'todo status 201': (r) => r.status === 201,
        });
    });

    sleep(1);
}