const WebSocket = require('ws');
const request = require('request');

const access_token = process.argv[2];
var timeout = 1500;

var favouriteStatus = function(statusId) {
	request({
		url: `https://xn--69aa8bzb.xn--y9a3aq/api/v1/statuses/${statusId}/favourite`,
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${access_token}`
		},
	}, (error, response, _body) => {
		if (error || response.statusCode != 200) {
			setTimeout(() => {
				favouriteStatus(statusId);
			}, timeout);
		}
	});
};

var connect = function() {
	let ws = new WebSocket('wss://xn--69aa8bzb.xn--y9a3aq/api/v1/streaming/?stream=public:local');
	console.log('connected');

	ws.on('close', () => {
		console.log('disconnected, trying to reconnect');
		setTimeout(connect, timeout);
	});

	ws.on('error', () => {
		console.log('disconnected, trying to reconnect');
		setTimeout(connect, timeout);
	});

	ws.on('message', (msg) => {
		let message = JSON.parse(msg);
		let status = JSON.parse(message.payload);

		if (message.event == 'update') {
			if (!status.application.name.toLowerCase().includes("crossposter")) {
				favouriteStatus(status.id);
			}
		}
	});
};

connect();
