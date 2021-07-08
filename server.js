// Require the framework and instantiate it
const fastify = require("fastify")({ logger: true });
const { ObjectId } = require("mongodb");
const argon2 = require("argon2");
const createError = require("http-errors");
fastify.register(require("fastify-jwt"), {
  secret: "supersecret", //'supersecret est la clé de décryptage du token, il faut absolument la garder secrète
});

// Connection à la BDD

fastify.register(require("fastify-mongodb"), {
  // force to close the mongodb connection when app stopped
  // the default value is false
  forceClose: true,

  url: "mongodb://localhost:27017/superheroes",
});

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

// Déclarer la route /heroes - Cette route retournera la liste des avengers
const avengers = ["Iron Man", "Captain America", "Spiderman"];

// /heroes GET - obtiens la liste des héros

fastify.get("/heroes", async () => {
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.find({}).toArray();
  return result;
});

// /heroes/69 GET -obtiens le héros avec l'ID 69
// /heroes/heroesId ... findOne()

fastify.get("/heroes/:heroesId", async (request, reply) => {
  // Documentation : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
  // const heroesId = request.params.heroesId
  const { heroesId } = request.params;
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.findOne({
    _id: new ObjectId(heroesId),
  });
  return result;
});

// /heroes POST - creer un nouvel héros

fastify.post("/heroes", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const result = await collection.insertOne(request.body);
  return result.ops[0].name;
  //.ops permet de renvoyer un tableau sans les infos du serveur
  // le .name permet d'avoir uniquement le nom de l'indice 0 du tableau
});

fastify.get("/me", function () {
  return {
    prénom: "Mehdi",
    nom: "Zed",
    job: "Dev Junior",
  };
});

// /heroes/bio/id
// Cette route devra retourné: nomDuHero connu sous le nom de vraiNom. Je suis née à lieuDeNaissance. J'ai XX en intelligence, et YY en vitesse.

fastify.get("/heroes/bio/:heroesId", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const { heroesId } = request.params;
  const result = await collection.findOne({
    _id: new ObjectId(heroesId),
  });

  const {
    name,
    biography,
    powerstats: { intelligence, speed },
  } = result;
  // const { speed, intelligence } = powerstats
  // Template literals: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  return `${name} connu sous le nom de ${biography["full-name"]}. Je suis née à ${biography["place-of-birth"]}. J'ai ${intelligence} en intelligence, et ${speed} en vitesse.`;
});

fastify.delete("/heroes/:heroesId", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const { heroesId } = request.params;
  const result = await collection.findOneAndDelete({
    _id: new ObjectId(heroesId),
  });
  return result;
});

fastify.patch("/heroes/:id", async (request, reply) => {
  const collection = fastify.mongo.db.collection("heroes");
  const { id } = request.params;
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: request.body },
    { returnDocument: "after" }
  );

  return result;
});

// Je souhaite:
// Une route qui me permette de créer un nouvel utilisateur (user) dans une collection users
// 		- email
// 		- password
// 		- role (user/admin)
// Une route qui me permette de récupérer tout les utilisateurs
// Une route qui me permette de récupérer un utilisateur par son id
// Une route qui me permette de mettre à jour un utilisateur par son id

fastify.post("/users", async (request, reply) => {
  try {
    const collection = fastify.mongo.db.collection("user");
    const { email, password, role } = request.body;

    const userExist = await collection.findOne({ email });

    if (userExist) {
      return createError(409, "cet email est déjà pris");
    }

    if (password.length < 3) {
      // throw new Error("Mot de passe trop court - au moins 3 caractères")
      return createError.NotAcceptable(
        "Mot de passe trop court - au moins 3 caractères"
      );
    }

    const hash = await argon2.hash(password);
    const newUser = {
      email: request.body.email,
      password: hash,
      role: request.body.role,
    };
    const result = await collection.insertOne(newUser);
    return result.ops;
  } catch (err) {
    console.error(err);
    // reply.code(409).send({message: err.message})
    return createError(500, err.message);
    // return createError.Conflict(err.message)
  }
});

fastify.get("/users", async (request, reply) => {
  const collection = fastify.mongo.db.collection("users");
  const result = await collection.find({}).toArray();
  return result;
});

fastify.get("/users/:id", async (request, reply) => {
  const collection = fastify.mongo.db.collection("users");
  const { id } = request.params;
  const result = await collection.findOne({
    _id: new ObjectId(id),
  });
  return result;
});

fastify.patch("/users/:id", async (request, reply) => {
  const collection = fastify.mongo.db.collection("users");
  const { id } = request.params;
  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
    },
    { $set: request.body },
    { returnDocument: "after" }
  );

  return result;
});

fastify.delete("/users/:id", async (request, reply) => {
  const collection = fastify.mongo.db.collection("users");
  const { id } = request.params;
  const result = collection.findOneAndDelete({
    _id: new ObjectId(id),
  });

  return result;
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
