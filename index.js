const WebSocket = require('ws');
const request = require('request');

const access_token = process.env.access_token;
var timeout = 1500;

var favouriteStatus = function(statusId) {
	request({
		url: `https://xn--69aa8bzb.xn--y9a3aq/api/v1/statuses/${statusId}/favourite`,
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${access_token}`
		},
	}, (error, response, body) => {
		console.log(`${statusId} favourite response: ${body} \n`);

		if ((error || response.statusCode != 200) && response.statusCode != 401) {
			setTimeout(() => {
				favouriteStatus(statusId);
			}, timeout);
		}
	});
};

var connect = function() {
	let ws = new WebSocket(`wss://xn--69aa8bzb.xn--y9a3aq/api/v1/streaming/?stream=public:local&access_token=${access_token}`);
	console.log('connected');

	ws.on('close', () => {
		console.log('close: disconnected, trying to reconnect');
		setTimeout(connect, timeout);
	});

	ws.on('error', (msg) => {
		console.log('error: disconnected, trying to reconnect:', msg);
		if (!msg.includes("401")) {
			setTimeout(connect, timeout);
		}
	});

	ws.on('message', (msg) => {
		let message = JSON.parse(msg);
		let status = JSON.parse(message.payload);

		if (message.event == 'update') {
			if (!status.application.name.toLowerCase().includes('crossposter')) {
				console.log(`new message: ${message.payload} \n${'-'.repeat(50)}`);
				favouriteStatus(status.id);
			}
		}
	});
};

connect();
