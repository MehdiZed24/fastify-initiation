const { ObjectId } = require("mongodb"); // https://docs.mongodb.com/drivers/node/current/fundamentals/
const createError = require("http-errors");


async function routes(fastify, options) {
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
}

module.exports = routes;
