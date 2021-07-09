// Require the framework and instantiate it
const fastify = require("fastify")({ logger: true });
const { ObjectId } = require("mongodb");
const argon2 = require("argon2");
const createError = require("http-errors");
fastify.register(require("fastify-jwt"), {
  secret: "jeveuxdespates", //'supersecret est la clé de décryptage du token, il faut absolument la garder secrète
});


fastify.register(require('fastify-cors'), {
	origin: "*"
})


// Connexion à la BDD
fastify.register(require('./connector'))

// Importation des routes /heroes
fastify.register(require('./src/routes/heroes.js'))
fastify.register(require('./src/routes/users.js'))
//METHOD API REST
// GET - READ
// POST - CREATE
// PATCH / PUT - UPDATE
// DELETE - DELETE

// Declare a route
fastify.get("/", (request, reply) => {
  // Ici on retourne un objet javascrit qui va etre converti en JSON (JavaScript Object Notation)
  return { hello: "world" };
});



// se connecter à son compte

fastify.post("/login", async (request, reply) => {
  //Je récupère l'email et le password dan la request
  //Je cherche si un utilisateur possède cet email
  //S'il existe, on vérifie que les passwords correspondent
  //Sinon, on génère une erreur

  const { email, password } = request.body;
  const collection = fastify.mongo.db.collection("users");

  const userExist = await collection.findOne({ email });

  if (!userExist) {
    return createError(400, "E-mail ou mot de passe incorrect");
  }
  const match = await argon2.verify(userExist.password, password);

  if (!match) {
    return createError(400, "E-mail ou mot de passe incorrect");
  }

  //Je sais que l'email et le mot de passe sont corrects, j'envoi un token au client (permettant d'ainsi l'authentifier)

  const token = fastify.jwt.sign({ id: userExist._id, role: userExist.role });

  return { token };
});

fastify.get("/protected", async (request, reply) => {
  // Si l'utilisateur ne m'envoie pas de token, je dois lui retourner une erreur
  // Sinon, je lui retourne un objet contenant la propriété message avec Bienvenue comme valeur
  const result = await request.jwtVerify()
  console.log(result)
  return {message:'Bienvenue'}
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
