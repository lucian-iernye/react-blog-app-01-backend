const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb");
const path = require("path");

const app = express();

// we have this mock data in our mongodb now so we don't need this anymore
// const articlesInfo = {
//   "learn-react": {
//     upvotes: 0,
//     comments: [],
//   },
//   "learn-node": {
//     upvotes: 0,
//     comments: [],
//   },
//   "software-development": {
//     upvotes: 0,
//     comments: [],
//   },
// };

app.use(express.static(path.join(__dirname, "/build")));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");

    await operations(db);

    // closing the connection with the database
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

// getting the articles from the db
app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

//
//
//

// update upvote endpoint
app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

//
//
//

// add comments endpoint
app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendfile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
