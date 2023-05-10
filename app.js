//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

let userSchema, User;

async function main() {
  try {
    await mongoose.connect(process.env.uri, { useNewUrlParser: true });
    console.log("Connected");

    userSchema = new mongoose.Schema({
      email: String,
      password: String,
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
      bcrypt.compare(pass, found.password, function (err, result) {
        if (result) res.render("secrets");
      });
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
    bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
      let newUser = new User({
        email: req.body.username,
        password: hash,
      });
      try {
        await newUser.save();
        res.render("secrets");
      } catch (err) {
        res.send(err);
      }
    });
  });

app.listen("3000", () => {
  console.log("Server started at port 3000");
});
