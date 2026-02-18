const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.teymvgh.mongodb.net/?appName=Cluster0`;

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  global._mongoClientPromise = client.connect().then(() => {
    console.log("MongoDB connected");
    return client;
  });
}

clientPromise = global._mongoClientPromise;

async function startServer() {
  const client = await clientPromise;
  const db = client.db("onlineRetailDB");

  const productsCollection = db.collection("productsData");
  const cartCollection = db.collection("cartData");

  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.get(
    "/products/category",
    asyncHandler(async (req, res) => {
      const category = req.query.category;
      let result;

      if (category) {
        console.log("Filtering by category:", category);
        result = await productsCollection.find({ category }).toArray();
      } else {
        console.log("Fetching all products");
        result = await productsCollection.find().toArray();
      }

      res.send(result);
    }),
  );

  app.get(
    "/products/:id",
    asyncHandler(async (req, res) => {
      const result = await productsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    }),
  );

  app.post(
    "/cart",
    asyncHandler(async (req, res) => {
      const result = await cartCollection.insertOne(req.body);
      res.send(result);
    }),
  );

  app.get(
    "/cart",
    asyncHandler(async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    }),
  );

  app.delete(
    "/cart/:id",
    asyncHandler(async (req, res) => {
      const id = req.params.id;

      const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    }),
  );

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ error: "Something went wrong" });
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
