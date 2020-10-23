const express = require("express");
const app = express();

const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalStrategy = require("passport-local-mongoose");
const randToken = require("rand-token");
const nodemailer = require("nodemailer");

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// modeles
const User = require("./models/user");
const Reset = require("./models/reset");
const Receipe = require("./models/receipe");
const Favourite = require("./models/favourite");
const Ingredient = require("./models/ingredient");
const Schedule = require("./models/schedule");

// instanciation format ejs
app.set("view engine", "ejs");
app.use(express.static("public"));

// prise en compte données formulaires
app.use(bodyParser.urlencoded({ extended: false }));

// flashes
app.use(flash());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

const PORT = 3000;
const pw = "C0denCQRT";
const db = "cooking";
const { base } = require("./models/user");

const atlasUrl = `mongodb+srv://fabezio:${pw}@cluster0.jrkt0.mongodb.net/${db}?retryWrites=true&w=majority`;
const localUrl = `mongodb://localhost/${db}`;
// const atlasUrl = `mongodb+srv://fabezio:<password>@cluster0.jrkt0.mongodb.net/<dbname>?retryWrites=true&w=majority`
const url = localUrl;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash("error", "authentication needed! please log in");
    res.redirect("/login");
  }
}

// chemins _________________
// principal (hors connexion)
app.get("/", (req, res) => {
  console.log(req.user);
  res.render("index", {});
});
const tempo = 1500;
app
  .route("/login")
  .get((req, res) => res.render("login", {}))
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(user, (err) => {
      if (err) {
        // req.flash("error", `Oops, problem`)
        res.render("login");
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          req.flash("success", `glad to see you again, ${req.body.username}`);
          // setTimeout(()=> {

          // }, tempo)
          res.redirect("/dashboard");
        });
      }
    });
  });

app
  .route("/signup")
  .get((req, res) => res.render("signup", {}))
  .post((req, res) => {
    const newUser = new User({
      username: req.body.username,
    });
    User.register(newUser, req.body.password, (err, user) => {
      if (err) {
        console.log(err);
        res.render("signup", {});
      } else {
        passport.authenticate("local")(req, res, function () {
          req.flash("success", `how do you do, ${req.body.username}`);
          // req.flash("success", `Bienvenue, ${user.username}`)
          // setTimeout(()=> {

          // }, tempo)
          res.redirect("/login");
        });
      }
    });
  });

app.route("/about").get((req, res) => res.render("about", {}));

app
  .route("/forgot")
  .get((req, res) => res.render("forgot", {}))
  .post((req, res) => {
    User.findOne({ username: req.body.username }, (err, userFound) => {
      if (err) {
        console.log(err);
        res.redirect("/login");
      } else {
        const token = randToken.generate(16);
        console.log(token);
        Reset.create({
          username: userFound.username,
          resetPassordToken: token,
          resetPasswordExpires: Date.now() + 3600000,
        });
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "cooking.tester1064@gmail.com",
            pass: "Marajade1",
          },
        });
        // console.log(transporter.auth)
        const mailOptions = {
          from: "cooking.tester1064@gmail.com",
          to: req.body.username,
          subject: "link to reset your password",
          text: `click here to reset your password: http://localhost:3000/reset/${token}`,
        };
        transporter.sendMail(mailOptions, (err, response) => {
          if (err) console.log(err);
          else {
            // console.log(mailOptions)
            console.log("reset mail ready to be sent");
            res.redirect("/login");
            console.log("reset mail has been sent");
          }
        });
      }
    });
  });

app.get("/reset", (req, res) => {
  res.render("reset", {});
});

app
  .route("/reset/:token")
  .get((req, res) => {
    Reset.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      (err, obj) => {
        if (err) {
          console.log("Token expired... please resend your mail");
          res.redirect("/forgot");
        } else {
          res.render("reset", { token: req.params.token });
        }
      }
    );
  })
  .post((req, res) => {
    Reset.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      (err, obj) => {
        if (err) {
          console.log("Token expired... please resend your mail");
          res.redirect("/login");
        } else {
          if (req.body.password2 == req.body.password) {
            User.findOne({ username: obj.username }, (err, user) => {
              if (err) console.log(err);
              else {
                // console.log(user.username)
                user.setPassword(req.body.password, (err) => {
                  user.save();
                  const updatedReset = {
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                  };
                  Reset.findOneAndUpdate(
                    { resetPassordToken: req.params.token },
                    updatedReset,
                    (err, obj1) => {
                      if (err) console.log(err);
                      res.redirect("/login");
                      //     else {
                      // }
                    }
                  );
                  // if(err) console.log(err)
                  // else {
                  // }
                });
              }
            });
          }
          // res.render("reset", {token: req.params.token})
        }
      }
    );
  });

app.get("/logout", (req, res) => {
  req.logout();
  req.flash("error", "you have been logged out");
  console.log("utilisateur déconnecté");
  res.redirect("/login");
});

// menu abonné
app.route("/dashboard").get(isLoggedIn, (req, res) => {
  console.log(req.user);
  res.render("dashboard", {});
});

// Recettes
app.get("/dashboard/myreceipes", isLoggedIn, (req, res) => {
  res.render("receipe", {});
});
app
  .route("/dashboard/newreceipe", isLoggedIn)
  .get((req, res) => {
    Receipe.find(
      {
        user: req.user.id,
      },
      (err, receipe) => {
        console.log(err || "liste trouvée");
        if (!err) res.render("newreceipe", { receipe: receipe });
      }
    );
    // if(Receipes && Receipes.length) req.flash("success", "receipes found")
    // else req.flash("error", "no receipe yet")
  })
  .post((req, res) => {
    const newReceipe = new Receipe({
      name: req.body.name,
      image: req.body.image,
      user: User.username,
    });
  });

app.get("/dashboard/favourites", (req, res) => {
  res.render("favourites", {});
});
app.get("/dashboard/schedule", (req, res) => {
  res.render("schedule", {});
});
app.get("/dashboard/about", (req, res) => {
  res.render("about", {});
});
// app.get("/edit", (req, res) =>{
//     res.render("edit", {})
// } )

// recherche et suppression de tokens expirés
Reset.find({ resetPasswordExpires: { $lt: Date.now() } }, (err, obj) => {
  console.log(err || obj);
  if (!err)
    Reset.deleteMany({ resetPasswordExpires: { $lt: Date.now() } }, (err) => {
      if (err) console.log(err);
    });
});
// console.log(expires)

app.listen(PORT, () => {
  console.log("Serveur à l'écoute... ");
  console.log(`port utilisé: ${PORT}`);
  console.log(`base de données: ${db}`);
});
