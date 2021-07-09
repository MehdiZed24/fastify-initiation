
const { ObjectId } = require('mongodb') // https://docs.mongodb.com/drivers/node/current/fundamentals/
const argon2 = require('argon2') // https://www.npmjs.com/package/argon2

async function routes(fastify, options) {
	// Déclarer la route /heroes - Cette route retournera la liste des heros
	// /heroes GET - Obtiens la liste des héros
	fastify.get('/heroes', async () => {
		const collection = fastify.mongo.db.collection('heroes')
		const result = await collection.find({}).toArray()
		return result
	})
	// /heroes/69 GET - Obtiens le héros ayant l'id 69
	// /heroes/:heroId ... findOne()
	fastify.get('/heroes/:heroesId', async (request, reply) => {
		// Documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
		// const heroesId = request.params.heroesId
		const { heroesId } = request.params
		const collection = fastify.mongo.db.collection('heroes')
		const result = await collection.findOne({
			_id: new ObjectId(heroesId),
		})
		return result
	})

	// /heroes/bio/id
	// Cette route devra retourner: nomDuHero connu sous le nom de vraiNom. Je suis née à lieuDeNaissance. J'ai XX en intelligence, et YY en vitesse.
	fastify.get('/heroes/bio/:heroesId', async (request, reply) => {
		const collection = fastify.mongo.db.collection('heroes')
		const { heroesId } = request.params
		const result = await collection.findOne({
			_id: new ObjectId(heroesId),
		})

		// Version ES6
		const {
			name,
			biography,
			powerstats: { intelligence, speed },
		} = result

		// Template literals: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
		return `${name} connu sous le nom de ${biography['full-name']}. Je suis née à ${biography['place-of-birth']}. J'ai ${intelligence} en intelligence, et ${speed} en vitesse.`

		// Version ES5 (vieux JS)
		// const name = result.name
		// const fullName = result.biography["full-name"]
		// const placeOfBirth = result.biography["full-name"]
		// const intelligence = result.powerstats.intelligence
		// const speed = result.powerstats.speed

		// return name + " connu sous le nom de " + fullName + ". Je suis née à " + placeOfBirth + ". J'ai " + intelligence + " en intelligence, et + " + speed + " en vitesse."
	})

	// /heroes POST - Ajoute un nouvel héro
	fastify.post('/heroes', async (request, reply) => {
		const collection = fastify.mongo.db.collection('heroes')
		const result = await collection.insertOne(request.body)
		return result.ops[0]
		// reply.send(null)
	})

	fastify.delete('/heroes/:heroesId', async (request, reply) => {
		const collection = fastify.mongo.db.collection('heroes')
		const { heroesId } = request.params
		const result = await collection.findOneAndDelete({
			_id: new ObjectId(heroesId),
		})
		return result
	})

	fastify.patch('/heroes/:id', async (request, reply) => {
		const collection = fastify.mongo.db.collection('heroes')
		const { id } = request.params
		const result = await collection.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			{ $set: request.body },
			{ returnDocument: 'after' }
		)
		return result
	})
}

module.exports = routes
