//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

let userSchema, User;

async function main() {
  try {
    await mongoose.connect(process.env.uri, { useNewUrlParser: true });
    console.log("Connected");

    userSchema = new mongoose.Schema({
      email: String,
      password: String,
      googleId: String,
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    User = new mongoose.model("User", userSchema);

    passport.use(User.createStrategy());
    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user, done) {
      done(null, user);
    });

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.clientID,
          clientSecret: process.env.clientSecret,
          callbackURL: "http://localhost:3000/auth/google/secrets",
          userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        function (accessToken, refreshToken, profile, cb) {
          console.log(profile);
          User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
          });
        }
      )
    );
  } catch (err) {
    console.log(err);
  }
}
main();

/////////////////////////////////////// route: home //////////////////////////////////////////

app.get("/", async (req, res) => {
  res.render("home");
});

/////////////////////////////////////// route: login //////////////////////////////////////////

app
  .route("/login")
  .get(async (req, res) => {
    res.render("login");
  })
  .post(async (req, res) => {
    let user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(user, async (err) => {
      if (err) console.log(err);
      else {
        await passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

/////////////////////////////////////// route: register //////////////////////////////////////////

app
  .route("/register")
  .get(async (req, res) => {
    res.render("register");
  })
  .post(async (req, res) => {
    await User.register(
      { username: req.body.username },
      req.body.password,
      async (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          await passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

/////////////////////////////////////// route: secrets //////////////////////////////////////////

app.route("/secrets").get((req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

/////////////////////////////////////// route: logout //////////////////////////////////////////

app.get("/logout", async (req, res) => {
  req.logout((err) => {
    console.log(err);
  });
  res.redirect("/");
});

/////////////////////////////////////// route: google authentiacation //////////////////////////////////////////

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

/////////////////////////////////////// Listening //////////////////////////////////////////

app.listen("3000", () => {
  console.log("Server started at port 3000");
});
