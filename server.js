const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')

const app = express()

app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: false}))

const PORT = 3000
const pw = "C0denCQRT"
const db = "cooking"
// const coll_1 = "user"
// const userOne = coll_1
// console.log(`collection principale: ${coll_1}`)
// const atlasUrl = "mongodb+srv://fabezio:<password>@cluster0.0gg5s.mongodb.net/<dbname>?retryWrites=true&w=majority"
const User = require("./models/user")


const atlasUrl = `mongodb+srv://fabezio:${pw}@cluster0.0gg5s.mongodb.net/${db}?retryWrites=true&w=majority`
// mongoose.set("useUnifiedTopology", true)
mongoose.connect(
    atlasUrl, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
// mongoose.connect(`mongodb://localhost/${db}`, {useNewUrlParser: true})

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
    .post((req, res) => {
        const user = {
            username: req.body.username,
            password: req.body.password
        }
        console.log(user)
        User.create(user, err => {
            if (err) console.log(err )
            else {
                console.log("User created")
                res.render("index", {})
            }
        })
            
    })

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

app.listen(PORT, () => {
    console.log("Serveur à l'écoute... ")
    console.log(`port utilisé: ${PORT}`)
    console.log(`base de données: ${db}`)
    // console.log(`collection principale: ${coll_1}`)


})