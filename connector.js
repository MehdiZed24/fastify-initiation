const fastifyPlugin = require('fastify-plugin')

async function dbConnector (fastify, options) {
	// Connexion à la BDD
	fastify.register(require('fastify-mongodb'), {
		forceClose: true,
		url: 'mongodb://localhost:27017/superheroes',
	})
}

module.exports = fastifyPlugin(dbConnector)
