const http = require('http');

const data = JSON.stringify({
    email: 'saividwan.06@gmail.com',
    password: 'invalidpassword'
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Body:', body);
        process.exit(res.statusCode === 401 ? 0 : 1);
    });
});

req.on('error', (e) => {
    console.error(e);
    process.exit(1);
});

req.write(data);
req.end();
