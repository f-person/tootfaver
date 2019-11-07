const request = require('request');
const {
	SimplyWS
} = require('simplyws');
const WebSocket = require('ws');

const pod = process.env.pod;
const access_token = process.env.access_token;
const timeout = 6000;
const reconnectInterval = 1000;

const favouriteStatus = (statusId) => {
	request({
		url: `https://${pod}/api/v1/statuses/${statusId}/favourite`,
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${access_token}`
		},
	}, (error, response, body) => {
		console.log(`${statusId} favourite response: ${body} \n`);

		if (error || response.statusCode != 200) {
			setTimeout(() => {
				favouriteStatus(statusId);
			}, timeout);
		}
	});
};

const favouriteLatestToots = () => {
	request({
		url: `https://${pod}/api/v1/timelines/public?local=true&access_token=${access_token}`,
		method: 'GET',
	}, (error, response, body) => {
		if (error || response.statusCode != 200) {
			setTimeout(() => {
				favouriteLatestToots();
			}, timeout);
		} else {
			let responseData = JSON.parse(body);
			responseData.forEach((status) => {
				if (!status.favourited && !status.application.name.toLowerCase().includes('crossposter')) {
					favouriteStatus(status.id);
				}
			});
		}
	});
}

var ws, simplyWS;

const connect = () => {
	favouriteLatestToots();

	ws = new WebSocket(`wss://${pod}/api/v1/streaming/?stream=public:local&access_token=${access_token}`);
	simplyWS = new SimplyWS({
		socket: ws,
		autoConnects: true
	});

	simplyWS.on('open', () => {
		console.log('connected');
	});

	simplyWS.on('close', () => {
		console.log('closed');
	});

	simplyWS.on('error', (error) => {
		console.log('error:', error);
	});

	simplyWS.on('message', (msg) => {
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
setInterval(() => {
	simplyWS.close();
	connect();
}, reconnectInterval);
