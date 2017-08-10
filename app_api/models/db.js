const mongoose = require('mongoose');
let dbURI = 'mongodb://localhost/Loc8r';

if(process.env.NODE_ENV === 'production') {
	dbURI = process.env.MONGOLAB_URI
}

require('./locations');

mongoose.connect(dbURI);

mongoose.connection.on('connected', () => {
	console.log('mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', (err) => {
	console.log('mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
	console.log('mongoose disconnected');
});

const gracefulShutdown = (msg, callback) => {
	mongoose.connection.close(() => {
		console.log('mongoose disconnected through ' + msg);
		callback();
	});
};

// para os reinicios do nodemon
process.once('SIGUSR2', () => {
	gracefulShutdown('nodemon restart', () => {
		process.kill(process.pid, 'SIGUSR2');
	});
});

// para o encerramento da aplicação
process.on('SIGINT', () => {
	gracefulShutdown('app termination', () => {
		process.kill(0);
	});
});

//para o encerramento da aplicação no heroku
process.on('SIGTERM', () => {
	gracefulShutdown('heroku app shutdown', () => {
		process.exit(0);
	});
});