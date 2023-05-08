//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

let userSchema, User;

async function main() {
  try {
    await mongoose.connect(
      "mongodb://127.0.0.1:27017/secretDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0",
      { useNewUrlParser: true }
    );
    console.log("Connected");

    userSchema = new mongoose.Schema({
      email: String,
      password: String,
    });

    let secret = "Thiscanbeourownlittlesecret";
    userSchema.plugin(encrypt, {
      secret: secret,
      encryptedFields: ["password"],
    });

    User = new mongoose.model("User", userSchema);
  } catch (err) {
    console.log(err);
  }
}
main();

app.get("/", async (req, res) => {
  res.render("home");
});
app
  .route("/login")
  .get(async (req, res) => {
    res.render("login");
  })
  .post(async (req, res) => {
    let userName = req.body.username;
    let pass = req.body.password;
    let found;
    try {
      found = await User.findOne({ email: userName });
    } catch (err) {
      res.send(err);
    }
    if (found) {
      if (found.password === pass) {
        res.render("secrets");
      }
    } else {
      res.redirect("/register");
    }
  });
app
  .route("/register")
  .get(async (req, res) => {
    res.render("register");
  })
  .post(async (req, res) => {
    let newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    try {
      await newUser.save();
      res.render("secrets");
    } catch (err) {
      res.send(err);
    }
  });

app.listen("3000", () => {
  console.log("Server started at port 3000");
});
