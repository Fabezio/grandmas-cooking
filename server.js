const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const bcrypt = require('bcrypt')
const session = require('express-session')
const passport = require('passport')
const passportLocalStrategy = require('passport-local-mongoose')

const app = express()
app.use(session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

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
const { base } = require('./models/user')


const atlasUrl = `mongodb+srv://fabezio:${pw}@cluster0.0gg5s.mongodb.net/${db}?retryWrites=true&w=majority`
// mongoose.set("useUnifiedTopology", true)
mongoose.connect(
    atlasUrl, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    )
    const User = require("./models/user")
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.route("/")
    .get((req, res) => res.render("index", {}))

app.route("/login")
    .get((req, res) => res.render("login", {}))
    .post((req, res) => {
        User.findOne({username: req.body.username}, (err, foundUser) => {
            // console.log (err || "c'est ok")
            if(err) console.log(err)
            else {
                if(foundUser) {
                    const saltRounds = 10
                    bcrypt.compare(req.body.password, foundUser.password, (error, result) => {
                        if (error) {
                            console.log(error) 
                            // res.render("index", {})
                        }   
                        else {
                            
                            if(result) {
                                
                                console.log(`Bonjour, ${foundUser.username}`) 
                                res.render("index", {data: foundUser})
                            } else {
                                console.log("pas de pot") 
                                res.send("pas de pot")
                            }   
                                
                            
                           
                        }
                    })
                } else res.send("pense à t'incrire!")
        
            }
        })
        
    })
    app.route("/signup")
    .get((req, res) => res.render("signup", {}))
    .post((req, res) => {
        // const saltRounds = 10
        const newUser =  new User({
            username: req.body.username,
            // password: hash
        })
        User.register(newUser, req.body.password, (err, user) => {
            if(err) {
                console.log(err)
                res.render("signup", {})
            } else {
                passport.authenticate("local")(req, res, function() {
                    console.log(`Bienvenue, ${user.username}`)
                    res.redirect("signup")

                })
            }

        })
        // bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        //     // else 
        //     // console.log(hash)
        //     User.create(user, err => {
        //         if (err) {
        //             console.log(err)
        //             res.send("un problème est survenu, recommence")
        //         }
        //         else {
        //             console.log(`Bienvenue, ${user.username}!`)
        //             res.render("index", {})
        //         }
        //     })

        // })
        // const user = {
            //     username: req.body.username,
        // console.log(user)
        // User.find({username: username})
        //     password: req.body.password
        // }
        // console.log(user)
            
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