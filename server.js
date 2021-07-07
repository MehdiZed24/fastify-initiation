// Require the framework and instantiate it
const fastify = require("fastify")({ logger: true });
const { ObjectId } = require("mongodb");

// Connexion à la BDD
fastify.register(require("fastify-mongodb"), {
  forceClose: true,
  url: "mongodb://localhost:27017/superheroes",
});

// METHOD API REST
// GET - READ
// POST - CREATE
// PATCH / PUT - UPDATE
// DELETE - DELETE

// Declare a route
fastify.get("/", (request, reply) => {
  // Ici on retourne un objet javascript qui va être converti en JSON (JavaScript Object Notation)
  return { hello: "world" };
});

// Déclarer la route /heroes - Cette route retournera la liste des heros
// /heroes GET - Obtiens la liste des héros
fastify.get("/heroes", async () => {
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.find({}).toArray();
  return result;
});

// heroes/69 GET Obtiens le héros ayant l'id 69.
//heroes GET - Obitiens la lste des héros
fastify.get("/heroes/:heroesId", async (request, reply) => {
  // Documentation  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
  const heroesId = request.params.heroesId;
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.findOne({
    _id: new ObjectId(heroesId),
  });
  return result;
});

//heroes/bio/IDBCursor//Cette route devra retourner : nomDuHero connu sous le nom de vraiNom. Je suis née à lieuDeNaissance. H'ai XX en intelligence, et YY en vitesse.
fastify.get("/heroes/bio/:heroesId", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const { heroesId } = request.params;
  const result = await collection.findOne({
    _id: new ObjectId(heroesId)
  })

  const {name, biography, powerstats:{intelligence,speed}} = result
  return `${name} connu sous le nom de ${biography["full-name"]}. Je suis née à ${biography["place-of-birth"]}. J'ai ${intelligence} en intelligence, et ${speed} en vitesse.`;
});

// /heroes POST - Ajoute un nouvel héro
fastify.post("/heroes", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.insertOne(request.body);
  return result.ops[0].name;
  // reply.send(null)
});


fastify.delete('/heroes/:heroesId', async (request, reply)=>{
  const collection = fastify.mongo.db.collection("heroes")
  const {heroesId} = request.params 
  const result = await collection.findOneAndDelete({
    _id: new ObjectId(heroesId)
    })
    return result
})


fastify.patch('/heroes/:id', async (request,reply)=>{
  const collection = fastify.mongo.db.collection('heroes')
  const {id}= request.params
  const result = await collection.findOneAndUpdate(
    {_id: new ObjectId(id) }, 
    {$set :request.body },
    {returnDocument:'after'}
)
  return result
})


fastify.get("/me", function () {
  return {
    prenom: "Mehdi",
    nom: "Ziani",
    job: "developpeur Junior",
  };
});

// Run the server!
const start = async () => {
  try {
    console.log("Serveur lancé: http://localhost:3000");
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
