//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.render("home");
});
app.get("/login", async (req, res) => {
  res.render("login");
});
app.get("/register", async (req, res) => {
  res.render("register");
});

app.listen("3000", () => {
  console.log("Server startrd at port 3000");
});
