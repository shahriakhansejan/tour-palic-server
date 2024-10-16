const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const morgan = require("morgan");


// middleWare
app.use(cors());
app.use(express.json());
dotenv.config();
app.use(morgan("dev"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ocam1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const touristsData = client
      .db("touristsPlaces")
      .collection("touristsPlace");

    const usersData = client.db("touristsPlaces").collection("userData");

    const countryData = client.db("touristsPlaces").collection("countryData");

    // Tourists Place Data
    app.get("/places", async (req, res) => {
      const data = touristsData.find();
      const result = await data.toArray();

      const query = req.query.sort;

      if (!query || query === "default") {
        res.send(result);
        return;
      }

      let newRest = result.sort((a, b) =>
        query === "high"
          ? Number(b.averageCost) - Number(a.averageCost)
          : Number(a.averageCost) - Number(b.averageCost)
      );
      res.send(newRest);
    });

    app.get("/home-places", async (req, res) => {
      const data = touristsData.find().sort({ _id: -1 }).limit(6);
      const result = await data.toArray();
      res.send(result);
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await touristsData.findOne(query);
      res.send(result);
    });

    app.get("/places-email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      // const query = { userEmail: { $regex: email, $options: "i" } };
      const result = await touristsData.find(query).toArray();
      res.send(result);
    });

    app.get("/places-country/:country", async (req, res) => {
      const country = req.params.country.toLowerCase();
      const query = {
        countryName: { $regex: new RegExp(`^${country}$`, "i") },
      };
      const result = await touristsData.find(query).toArray();
      res.send(result);
    });

    app.post("/places", async (req, res) => {
      const doc = req.body;
      const result = await touristsData.insertOne(doc);
      res.send(result);
    });

    app.put("/places/:_id", async (req, res) => {
      const _id = req.params._id;
      const filter = { _id: new ObjectId(_id) };
      const options = { upsert: true };
      const updateInformation = req.body;

      console.log(updateInformation);

      const update = {
        $set: {
          spotName: updateInformation.spotName,
          countryName: updateInformation.countryName,
          averageCost: updateInformation.averageCost,
          travelTime: updateInformation.travelTime,
          totalVisitor: updateInformation.totalVisitor,
          userName: updateInformation.userName,
          userEmail: updateInformation.userEmail,
          location: updateInformation.location,
          description: updateInformation.description,
          season: updateInformation.season,
          photo: updateInformation.photo,
        },
      };

      const result = await touristsData.updateOne(filter, update, options);
      res.send(result);
    });

    app.delete("/places/:_id", async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const result = await touristsData.deleteOne(query);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;

      console.log({ email });

      if (!email) {
        res.json({ success: false, message: "Email is required!" });
      }

      const query = { email: email };
      const result = await usersData.findOne(query);

      console.log({ result });

      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersData.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const user = req.body;
      const filter = { userEmail: user.email };
      const updateUser = {
        $set: {
          lastLoggedAt: user.lastLoggedAt,
        },
      };
      const result = await usersData.updateOne(filter, updateUser);
      res.send(result);
    });

    // Country Data
    app.post("/country", async (req, res) => {
      const newCountry = req.body;
      const result = await countryData.insertOne(newCountry);
      res.send(result);
    });

    app.get("/country", async (req, res) => {
      const data = countryData.find();
      const result = await data.toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Update to vercel....");
});
app.get("/test", (req, res) => {
  res.json({ success: true, message: "This is test message" });
});

app.listen(port, () => {
  console.log(`Tour server is running on PORT ${port}`);
});
