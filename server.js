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
const randToken = require('rand-token')
const nodemailer = require('nodemailer')

const User = require("./models/user")
const Reset = require("./models/reset")

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
const { base } = require('./models/user')


const atlasUrl = `mongodb+srv://fabezio:${pw}@cluster0.jrkt0.mongodb.net/${db}?retryWrites=true&w=majority`
// const atlasUrl = `mongodb+srv://fabezio:<password>@cluster0.jrkt0.mongodb.net/<dbname>?retryWrites=true&w=majority`

mongoose.connect(
    atlasUrl, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.route("/")
    .get((req, res) => res.render("index", {}))

app.route("/login")
    .get((req, res) => res.render("login", {}))
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, err => {
            if(err) console.log(err)
            else {passport.authenticate("local")(req, res, () => {res.redirect("/dashboard")})}
        })
    })

app.route("/signup")
    .get((req, res) => res.render("signup", {}))
    .post((req, res) => {
        const newUser =  new User({
            username: req.body.username
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
    })
    
app.get("/logout", (req, res) => {
    req.logout()
    console.log('utilisateur déconnecté')
    res.redirect("/login")
})

app.route("/about")
    .get((req, res) => res.render("about", {}))

app.route("/dashboard")
    .get((req, res) => res.render("dashboard", {}))

app.route("/forgot")
    .get((req, res) => res.render("forgot", {}))
    .post((req, res) => {
        User.findOne({username: req.body.username}, (err, userFound) => {
            if(err) {
                console.log(err) 
                res.redirect('.login')
            }
            else {
                const token = randToken.generate(16)
                console.log(token)
                Reset.create({
                    username: userFound.username,
                    resetPassordToken: token,
                    resetPasswordExpires: Date.now() + 3600000
                })
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'cooking.tester1064@gmail.com',
                        password: 'Marajade1'
                    }
                })
                // console.log(transporter.auth)
                const mailOptions = {
                    from: 'cooking.tester1064@gmail.com',
                    to: req.body.username,
                    subject: "link to reset your password",
                    text: `click here to reset your password: http://localhost:3000/reset${token}`
                }
                transporter.sendMail(mailOptions, (err, response) => {
                    if (err) console.log(err)
                    else {
                        console.log(mailOptions)
                        console.log('reset mail ready to be sent')
                        response.redirect("/login") 
                        console.log('reset mail has been sent')
                    }
                })
            }
        })
    })

app.get('/reset',(req, res) => {
    res.render('reset', {})
})

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
})