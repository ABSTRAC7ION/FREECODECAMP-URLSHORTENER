require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const { Schema } = mongoose;

// Basic Configuration
const port = process.env.PORT || 3000;

// parse application
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//connect to database
const uri = process.env.URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

//checks if data base is connected
const connection = mongoose.connection;
connection.on("err", console.error.bind(console, "conncection error"));
connection.once("open", () => {
  console.log("connected");
});

app.use(cors());

//creating a schema for original url and short url
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model("URL", urlSchema);

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

//post og_url and short_url to screen and save to database for later access
app.post("/api/shorturl", async function (req, res) {
  var url = req.body.url;
  //creates random id
  var urlCode = nanoid();
  //checks if id is not valid return 404
  if (!validUrl.isUri(url)) {
    res.status(404).json({
      error: "invalid URL",
    });
  } else {
    //creates new schema
    let input = await URL.findOne({
      original_url: url,
    });
    //checks of input already exists in server
    if (input) {
      res.json({
        original_url: input.original_url,
        short_url: input.short_url,
      });
    } else {
      // else creates new input schema and save to server
      input = new URL({
        original_url: url,
        short_url: urlCode,
      });
      await input.save();
      res.json({
        original_url: input.original_url,
        short_url: input.short_url,
      });
    }
  }
});

app.get("/api/shorturl/:short_url?", async function (req, res) {
  try {
    const urlParam = await URL.findOne({
      short_url: req.params.short_url,
    });
    if (urlParam) {
      return res.redirect(urlParam.original_url);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("server error");
  }
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
