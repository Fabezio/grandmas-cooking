const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const app = express()

app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: false}))

const db = "grandmasDB"

mongoose.set("useUnifiedTopology", true)
mongoose.connect(`mongodb://localhost/${db}`, {useNewUrlParser: true})

// const Recipes = new mongoose.Schema({
//     name: String,
//     ingredients: Array
// })


app.route("/")
    .get((req, res) => res.render("index", {}))

app.route("/login")
    .get((req, res) => res.render("login", {}))

app.route("/signup")
    .get((req, res) => res.render("signup", {}))

app.route("/about")
    .get((req, res) => res.render("about", {}))

// app.route("/forgot")
//     .get((req, res) => res.render("forgot", {}))

// app.route("/edit")
//     .get((req, res) => res.render("edit", {}))

// app.route("/newfavorite")
//     .get((req, res) => res.render("newfavorite", {}))
// app.route("/newfavorite")
//     .get((req, res) => res.render("newfavorite", {}))

app.listen(3000, () => console.log("serveur démarré sur port 3000"))