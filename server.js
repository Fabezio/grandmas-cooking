const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const app = express()

app.set("view engine", "ejs")

app.route("/")
    .get((req, res) => res.render("index", {}))

app.listen(3000, () => console.log("serveur démarré sur port 3000"))