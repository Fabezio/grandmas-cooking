const express = require('express')
const app = express()

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

app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
  }),
)
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// routes
const dash =" /dashboard"
const dashRec = dash + "/myreceipes"

// modeles
const User = require('./models/user')
const Reset = require('./models/reset')
const Receipe = require('./models/receipe')
const Favourite = require('./models/favourite')
const Ingredient = require('./models/ingredient')
const Schedule = require('./models/schedule')

// instanciation format ejs
app.set('view engine', 'ejs')
app.use(express.static('public'))

// prise en compte données formulaires
app.use(bodyParser.urlencoded({ extended: false }))

// flashes
app.use(flash())
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  next()
})
function successFlash(msg) {
  if(req.flash) req.flash('success', msg)
}
function errorFlash(msg) {
  if(req.flash) req.flash('error', msg)
}

const PORT = 3000
const pw = 'C0denCQRT'
const db = 'cooking'
const { base } = require('./models/user')

const atlasUrl = `mongodb+srv://fabezio:${pw}@cluster0.jrkt0.mongodb.net/${db}?retryWrites=true&w=majority`
const localUrl = `mongodb://localhost/${db}`
// const atlasUrl = `mongodb+srv://fabezio:<password>@cluster0.jrkt0.mongodb.net/<dbname>?retryWrites=true&w=majority`
const url = atlasUrl

//  mongodb+srv://fabezio:C0denCQRT@cluster0.jrkt0.mongodb.net/$cooking?retryWrites=true&w=majority

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    req.flash('error', 'authentication needed! please log in')
    res.redirect('/login')
  }
}

// chemins _________________
// principal (hors connexion)
app.get('/', (req, res) => {
  console.log(req.user)
  res.render('index', {})
})
const tempo = 1500
app
  .route('/login')
  .get((req, res) => res.render('login', {}))
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    })
    req.login(user, (err) => {
      if (err) {
        // req.flash("error", `Oops, problem`)
        res.render('login')
        console.log(err)
      } else {
        passport.authenticate('local')(req, res, () => {
          req.flash('success', `glad to see you again, ${req.body.username}`)
          // setTimeout(()=> {

          // }, tempo)
          res.redirect('/dashboard')
        })
      }
    })
  })

app
  .route('/signup')
  .get((req, res) => res.render('signup', {}))
  .post((req, res) => {
    const newUser = new User({
      username: req.body.username,
    })
    User.register(newUser, req.body.password, (err, user) => {
      if (err) {
        console.log(err)
        res.render('signup', {})
      } else {
        passport.authenticate('local')(req, res, function () {
          req.flash('success', `how do you do, ${req.body.username}`)
          // req.flash("success", `Bienvenue, ${user.username}`)
          // setTimeout(()=> {

          // }, tempo)
          res.redirect('/login')
        })
      }
    })
  })

app.route('/about').get((req, res) => res.render('about', {}))

app
  .route('/forgot')
  .get((req, res) => res.render('forgot', {}))
  .post((req, res) => {
    User.findOne({ username: req.body.username }, (err, userFound) => {
      if (err) {
        console.log(err)
        res.redirect('/login')
      } else {
        const token = randToken.generate(16)
        console.log(token)
        Reset.create({
          username: userFound.username,
          resetPassordToken: token,
          resetPasswordExpires: Date.now() + 3600000,
        })
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'cooking.tester1064@gmail.com',
            pass: 'Marajade1',
          },
        })
        // console.log(transporter.auth)
        const mailOptions = {
          from: 'cooking.tester1064@gmail.com',
          to: req.body.username,
          subject: 'link to reset your password',
          text: `click here to reset your password: http://localhost:3000/reset/${token}`,
        }
        transporter.sendMail(mailOptions, (err, response) => {
          if (err) console.log(err)
          else {
            // console.log(mailOptions)
            console.log('reset mail ready to be sent')
            res.redirect('/login')
            console.log('reset mail has been sent')
          }
        })
      }
    })
  })

app.get('/reset', (req, res) => {
  res.render('reset', {})
})

app
  .route('/reset/:token')
  .get((req, res) => {
    Reset.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      (err, obj) => {
        if (err) {
          console.log('Token expired... please resend your mail')
          res.redirect('/forgot')
        } else {
          res.render('reset', { token: req.params.token })
        }
      },
    )
  })
  .post((req, res) => {
    Reset.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      (err, obj) => {
        if (err) {
          console.log('Token expired... please resend your mail')
          res.redirect('/login')
        } else {
          if (req.body.password2 == req.body.password) {
            User.findOne({ username: obj.username }, (err, user) => {
              if (err) console.log(err)
              else {
                // console.log(user.username)
                user.setPassword(req.body.password, (err) => {
                  user.save()
                  const updatedReset = {
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                  }
                  Reset.findOneAndUpdate(
                    { resetPassordToken: req.params.token },
                    updatedReset,
                    (err, obj1) => {
                      if (err) console.log(err)
                      res.redirect('/login')
                      //     else {
                      // }
                    },
                  )
                  // if(err) console.log(err)
                  // else {
                  // }
                })
              }
            })
          }
          // res.render("reset", {token: req.params.token})
        }
      },
    )
  })

app.get('/logout', (req, res) => {
  req.logout()
  req.flash('error', 'you have been logged out')
  console.log('utilisateur déconnecté')
  res.redirect('/login')
})

/*
 */
// menu abonné
app.route('/dashboard', isLoggedIn).get((req, res) => {
  console.log(req.user)
  res.render('dashboard', {})
})

/*
RRRRR   EEEEEE   CCCC   EEEEEE  III  PPPPP    EEEEEE   SSSS
R    R  E       C    C  E        I   p    p   E       S    S
R    R  E       C       E        I   P    P   E       S 
RRRRR   EEEEE   C       EEEE     I   PPPPP    EEEEE    SSSS
R  R    E       C       E        I   P        E            S
R   R   E       C    C  E        I   P        E       S    S
R    R  EEEEEE   CCCC   EEEEEE  III  P        EEEEEE   SSSS
 */
app.get('/dashboard/myreceipes', isLoggedIn, (req, res) => {
  Receipe.find({}, (err, receipe) => {
    console.log(err || 'receipes fetched')
    if (!err) res.render('receipe', { receipe: receipe })
  })
})
app
  .route('/dashboard/newreceipe', isLoggedIn)
  .get((req, res) => {
    res.render('newreceipe')

    // if(Receipes && Receipes.length) req.flash("success", "receipes found")
    // else req.flash("error", "no receipe yet")
  })
  .post((req, res) => {
    const newReceipe = new Receipe({
      name: req.body.receipe,
      image: req.body.logo,
      user: req.user.id,
    })
    newReceipe.save({}, (err) => {
      console.log(err || 'receipe added')
      if (!err) {
        flash('success', 'receipe added')
        res.redirect('/dashboard/myreceipes')
      }
    })
  })

app
  .route('/dashboard/myreceipes/:id', isLoggedIn)
  .get((req, res) => {
    Receipe.findOne(
      {
        user: req.user.id,
        _id: req.params.id,
      },
      (err, foundReceipe) => {
        console.log(err || 'i found it!')
        if (!err) {
          Ingredient.find(
            {
              user: req.user.id,
              receipe: req.params.id,
            },
            (err, foundIngredient) => {
              console.log(err || 'ingredient loaded')
              if (!err) {
                req.flash('success', 'here is your receipe')
                console.log(foundIngredient)
                res.render('ingredients', {
                  receipe: foundReceipe,
                  ingredients: foundIngredient,
                })
              }
            },
          )
        }
      },
    )
  })
  .post((req, res) => {
    const newIngredient = {
      user: req.user._id,
      receipe: req.params.id,
      name: req.body.name,
      bestDish: req.body.dish,
      quantity: req.body.quantity,
    }
    Ingredient.create(newIngredient, (err, newIngredient) => {
      console.log(err || 'ingredient added')
      if (!err) {
        req.flash('success', `${req.body.name} added`)
        res.redirect(`/dashboard/myreceipes/${req.params.id}`)
      }
    })
  })
  .delete((req, res) => {
    Receipe.deleteOne({ _id: req.params.id }, (err) => {
      const msg = 'receipe deleted'
      console.log(err || msg)
      if (!err) {
        req.flash('success', msg)
        res.redirect(`/dashboard/myreceipes`)
      }
    })
  })

/*
III  N    N   GGGG   RRRRR   EEEEEE  DDDDD   III  EEEEEE  N    N  TTTTTTT  SSSS  
 I   N    N  G    G  R    R  E       D    D   I   E       N    N     T    S    S
 I   NN   N  G       R    R  E       D    D   I   E       NN   N     T    S 
 I   N N  N  G   GG  RRRRR   EEEEE   D    D   I   EEEEE   N N  N     T     SSSS 
 I   N  N N  G    G  R  R    E       D    D   I   E       N  N N     T         S
 I   N   NN  G    G  R   R   E       D    D   I   E       N   NN     T    S    S
III  N    N   GGGG   R    R  EEEEEE  DDDDD   III  EEEEEE  N    N     T     SSSS  
*/

// LISTE
app
  .route('/dashboard/myreceipes/:id/:ingredientId', isLoggedIn)
  .delete((req, res) => {
    Ingredient.deleteOne({ _id: req.params.ingredientId }, (err) => {
      const msg = 'ingredient deleted'
      console.log(err || msg)
      if (!err) {
        req.flash('success', msg)
        res.redirect(`/dashboard/myreceipes/${req.params.id}`)
      }
    })
  })
  .put((req, res) => {
    const updatedIngredient = {
      name: req.body.name,
      bestDish: req.body.dish,
      quantity: req.body.quantity,
      user: req.user.id,
      receipe: req.params.id,
    }
    Ingredient.findByIdAndUpdate(
      { _id: req.params.ingredientId },
      updatedIngredient,
      (err, updatedData) => {
        if (err) console.log(err)
        else {
          req.flash("success",`${updatedData.receipe} has been updated`)
          res.redirect(`/dashboard/myreceipes/${req.params.id}`)
        }
      },
    )
  })

// NOUVEL INGREDIENT
app
  .route('/dashboard/myreceipes/:id/newingredient', isLoggedIn)
  .get((req, res) => {
    Receipe.findById({ _id: req.params.id }, (err, found) => {
      console.log(err || 'receipe found')
      if (!err) {
        res.render('newingredient', { receipe: found })
      }
    })
  })

// MODIFIER L'INGREDIENT
app
  .route('/dashboard/myreceipes/:id/:ingredientId/edit', isLoggedIn)
  .post((req, res) => {
    Receipe.findOne(
      { _id: req.params.id, user: req.user.id },
      (err, foundReceipe) => {
        if (err) console.log(err)
        else {
          Ingredient.findOne(
            { _id: req.params.ingredientId, receipe: req.params.id },
            (err, foundIngredient) => {
              if (err) console.log(err)
              else {
                req.flash('success', `${foundIngredient.name} found`)
                res.render('edit', {
                  ingredient: foundIngredient,
                  receipe: foundReceipe,
                })
              }
            },
          )
        }
      },
    )
  })

/*
FFFFFF     A     V     V   OOOO   U    U  RRRRR   III  TTTTTTT  EEEEEE   SSSS
F         A A    V     V  O    O  U    U  R    R   I      T     E       S    S
F         A A     V   V   O    O  U    U  R    R   I      T     E       S     
FFFF     A   A    V   V   O    O  U    U  RRRRR    I      T     EEEEE    SSSS     
F        AAAAA     V V    O    O  U    U  R  R     I      T     E            S
F       A     A    V V    O    O  U    U  R   R    I      T     E       S    S
F       A     A     V      OOOO    UUUU   R    R  III     T     EEEEEE   SSSS
*/

app
  .route('/dashboard/favourites', isLoggedIn)
  .get((req, res) => {
    Favourite.find({ user: req.user.id }, (err, found) => {
      if (err) console.log(err)
      else {
        if (found.length > 0) {
          req.flash('success', `there are ${found.length} favs`)
        } else {
          req.flash('error', `No fav yet`)
          // res.render("favourites");
        }
        res.render('favourites', { favourites: found })
      }
    })
  })
  .post((req, res) => {
    const newFav = {
      user: req.user.id,
      // receipe: req.receipe.id,
      image: req.body.image,
      title: req.body.title,
      desc: req.body.description,
    }
    Favourite.create(newFav, (err, createdFav) => {
      if (err) console.log(err)
      else {
        flash('success', `${createdFav.title} created`)
        res.redirect('/dashboard/favourites')
      }
    })
    // Receipe.find(
    //   {
    //     user: req.user.id,
    //   },
    //   (err, foundReceipe) => {
    //     if (err) console.log(err)
    //     else {
    //     }
    //   },
    // )
  })
app.route('/dashboard/favourites/newfavourite', isLoggedIn).get((req, res) => {
  res.render('newfavourite', {})
})
app.route('/dashboard/favourites/:id', isLoggedIn).delete((req, res) => {
  Favourite.deleteOne({ _id: req.params.id }, (err) => {
    if (err) console.log(err)
    else {
      flash("success", 'fav deleted')
      res.redirect('/dashboard/favourites')
    }
  })
})

/*
 SSS   CCC   H   H  EEEEE  DDDD   U   U  L      EEEEE   SSS 
S     C   C  H   H  E      D   D  U   U  L      E      S    
 SSS  C      HHHHH  EEEE   D   D  U   U  L      EEEE    SSS
    S C   C  H   H  E      D   D  U   U  L      E          S
SSSS   CCC   H   H  EEEEE  DDDD    UUU   LLLLL  EEEEE  SSSS

*/
app.route('/dashboard/schedule', isLoggedIn).get( (req, res) => {
  Schedule.find({
    user: req.user.id
  }, (err, found) => {
    if (err) console.log(err)
    else{
      req.flash("success", `${found.length} schedule${found.length > 1 ? 's' : ''} found`)
      res.render('schedule', {schedules: found})
    }
  })
})

app.route('/dashboard/schedule/:id', isLoggedIn)
.get((req, res) => {
  Schedule.findOne({_id: req.params.id}, err => {
    if (err) console.log(err, found)
    else {
      res.redirect("/dashboard/schedule")

    }
  })

app.post("/dashboard/schedule/newschedule", isLoggedIn, (req, res) => {
  const newSchedule = {
    ReceipeName: req.receipe.id,
    time: req.body.time,
    ScheduleDate: req.body.date,
  }
    Schedule.findOne({_id: req.params.id}, err => {
      if (err) console.log(err, found)
      else {
        res.redirect("/dashboard/schedule")
  
      }
    })
  })
})





app.get('/dashboard/about', isLoggedIn, (req, res) => {
  res.render('about', {})
})

// recherche et suppression de tokens expirés
Reset.find({ resetPasswordExpires: { $lt: Date.now() } }, (err, obj) => {
  console.log(err || obj)
  if (!err)
    Reset.deleteMany({ resetPasswordExpires: { $lt: Date.now() } }, (err) => {
      if (err) console.log(err)
    })
})
// console.log(expires)

app.listen(PORT, () => {
  console.log("Serveur à l'écoute... ")
  console.log(`port utilisé: ${PORT}`)
  console.log(`base de données: ${db}`)
})
