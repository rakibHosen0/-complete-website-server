const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
require("dotenv").config();

// PORT:
const port = 5055;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("service"));
app.use(fileUpload());

// MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zww7y.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const serviceCollection = client.db("fitnessCenter").collection("services");
  const feedbackCollection = client
    .db("fitnessCenter")
    .collection("clientsFeedback");
  const registrationCollection = client
    .db("fitnessCenter")
    .collection("registration");
  const adminCollection = client.db("fitnessCenter").collection("admin");

  //ADD SERVICE REGISTRATION (CREATE)
  app.post("/addRegistration", (req, res) => {
    const newRegistration = req.body;
    registrationCollection.insertOne(newRegistration).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // SHOW LOGGED IN CLIENT SERVICE LIST (READ)
  app.get("/clientServices", (req, res) => {
    registrationCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // Admin dashboard, show all register
  app.get("/adminServices", (req, res) => {
    registrationCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    serviceCollection
      .insertOne({ title, description, price, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/addReview", (req, res) => {
    const feedback = req.body;
    feedbackCollection.insertOne(feedback).then((result) => {
      console.log(result);
      res.send(result.insertedCount > 0);
    });
  });

  //========================= READ FEEDBACK/ REVIEWS AND SHOW (READ)===================================
  app.get("/reviews", (req, res) => {
    feedbackCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //========================= READ USER SELECTED SERVICE (READ)===================================
  app.get("/services/:_id", (req, res) => {
    serviceCollection
      .find({ _id: ObjectId(req.params._id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  //========================= UPDATE STATUS OF SERVICE(available for Admin Only) ==================
  app.patch("/updateServiceStatus/:_id", (req, res) => {
    registrationCollection
      .updateOne(
        { _id: ObjectId(req.params._id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then((result) => {
        console.log(result);
        res.send(result.modifiedCount > 0);
      });
  });

  //==================================== ADD ADMIN =================================================
  app.post("/addAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //==================================== VERIFY ADMIN LOGIN =========================================
  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email }).toArray((err, admins) => {
      console.log(admins);
      res.send(admins.length > 0);
    });
  });
});
// Root:
app.get("/", (req, res) => {
  res.send("The Fitness Center Server is running");
});

// Listener port
app.listen(process.env.PORT || port);
