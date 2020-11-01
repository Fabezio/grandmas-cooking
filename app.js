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

/* 
EEEEEEE NN   NN VV     VV     SSSSS  EEEEEEE TTTTTTT UU   UU PPPPPP  
EE      NNN  NN VV     VV    SS      EE        TTT   UU   UU PP   PP 
EEEEE   NN N NN  VV   VV      SSSSS  EEEEE     TTT   UU   UU PPPPPP  
EE      NN  NNN   VV VV           SS EE        TTT   UU   UU PP      
EEEEEEE NN   NN    VVV        SSSSS  EEEEEEE   TTT    UUUUU  PP      
 */

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
const dash = ' /dashboard'
const dashRec = dash + '/myreceipes'

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

/*
MM    MM  SSSSS    GGGG     DDDDD   IIIII  SSSSS  PPPPPP  LL        AAA   YY   YY 
MMM  MMM SS       GG  GG    DD  DD   III  SS      PP   PP LL       AAAAA  YY   YY 
MM MM MM  SSSSS  GG         DD   DD  III   SSSSS  PPPPPP  LL      AA   AA  YYYYY  
MM    MM      SS GG   GG    DD   DD  III       SS PP      LL      AAAAAAA   YYY   
MM    MM  SSSSS   GGGGGG    DDDDDD  IIIII  SSSSS  PP      LLLLLLL AA   AA   YYY   
                                                                                  

 */
// flashes
app.use(flash())
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  next()
})
function successFlash(msg) {
  if (req.flash) req.flash('success', msg)
}
function errorFlash(msg) {
  if (req.flash) req.flash('error', msg)
}

/* 
DDDDD   BBBBB        AAA    CCCCC   CCCCC  EEEEEEE  SSSSS   SSSSS  
DD  DD  BB   B      AAAAA  CC    C CC    C EE      SS      SS      
DD   DD BBBBBB     AA   AA CC      CC      EEEEE    SSSSS   SSSSS  
DD   DD BB   BB    AAAAAAA CC    C CC    C EE           SS      SS 
DDDDDD  BBBBBB     AA   AA  CCCCC   CCCCC  EEEEEEE  SSSSS   SSSSS  
                                                                   

 */
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

// const tempo = 1500
// chemins _________________
// principal (hors connexion)
/* 


MM    MM   AAA   IIIII NN   NN    IIIII NN   NN DDDDD   EEEEEEE XX    XX 
MMM  MMM  AAAAA   III  NNN  NN     III  NNN  NN DD  DD  EE       XX  XX  
MM MM MM AA   AA  III  NN N NN     III  NN N NN DD   DD EEEEE     XXXX   
MM    MM AAAAAAA  III  NN  NNN     III  NN  NNN DD   DD EE       XX  XX  
MM    MM AA   AA IIIII NN   NN    IIIII NN   NN DDDDDD  EEEEEEE XX    XX 
                                                                         


*/

app.get('/', (req, res) => {
  console.log(req.user)
  res.render('index', {})
})

/* 
UU   UU  SSSSS  EEEEEEE RRRRRR  
UU   UU SS      EE      RR   RR 
UU   UU  SSSSS  EEEEE   RRRRRR  
UU   UU      SS EE      RR  RR  
 UUUUU   SSSSS  EEEEEEE RR   RR 
                                
 */
/* 


LL       OOOOO    GGGG  IIIII NN   NN 
LL      OO   OO  GG  GG  III  NNN  NN 
LL      OO   OO GG       III  NN N NN 
LL      OO   OO GG   GG  III  NN  NNN 
LLLLLLL  OOOO0   GGGGGG IIIII NN   NN 
                                      

 */
app
  .route('/login')
  .get((_, res) => res.render('login', {}))
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

/*   FFFFFFF  OOOOO  RRRRRR    GGGG   OOOOO  TTTTTTT TTTTTTT EEEEEEE NN   NN    PPPPPP    AAA    SSSSS   SSSSS  WW      WW DDDDD   
  FF      OO   OO RR   RR  GG  GG OO   OO   TTT     TTT   EE      NNN  NN    PP   PP  AAAAA  SS      SS      WW      WW DD  DD  
  FFFF    OO   OO RRRRRR  GG      OO   OO   TTT     TTT   EEEEE   NN N NN    PPPPPP  AA   AA  SSSSS   SSSSS  WW   W  WW DD   DD 
  FF      OO   OO RR  RR  GG   GG OO   OO   TTT     TTT   EE      NN  NNN    PP      AAAAAAA      SS      SS  WW WWW WW DD   DD 
  FF       OOOO0  RR   RR  GGGGGG  OOOO0    TTT     TTT   EEEEEEE NN   NN    PP      AA   AA  SSSSS   SSSSS    WW   WW  DDDDDD  
                                                                                                                                
  
 */

app
  .route('/forgot')
  .get((_, res) => res.render('forgot', {}))
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
        transporter.sendMail(mailOptions, (err, _) => {
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
                    (err, _) => {
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

/* 

 SSSSS  IIIII   GGGG  NN   NN UU   UU PPPPPP  
SS       III   GG  GG NNN  NN UU   UU PP   PP 
 SSSSS   III  GG      NN N NN UU   UU PPPPPP  
     SS  III  GG   GG NN  NNN UU   UU PP      
 SSSSS  IIIII  GGGGGG NN   NN  UUUUU  PP      
                                              

 */

app
  .route('/signup')
  .get((_, res) => res.render('signup', {}))
  .post((req, res) => {
    const newUser = new User({
      username: req.body.username,
    })
    User.register(newUser, req.body.password, (err, _) => {
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

app.route('/about').get((_, res) => res.render('about', {}))

app.get('/logout', (req, res) => {
  req.logout()
  req.flash('error', 'you have been logged out')
  console.log('utilisateur déconnecté')
  res.redirect('/login')
})

/*


DDDDD     AAA    SSSSS  HH   HH BBBBB    OOOOO    AAA   RRRRRR  DDDDD   
DD  DD   AAAAA  SS      HH   HH BB   B  OO   OO  AAAAA  RR   RR DD  DD  
DD   DD AA   AA  SSSSS  HHHHHHH BBBBBB  OO   OO AA   AA RRRRRR  DD   DD 
DD   DD AAAAAAA      SS HH   HH BB   BB OO   OO AAAAAAA RR  RR  DD   DD 
DDDDDD  AA   AA  SSSSS  HH   HH BBBBBB   OOOO0  AA   AA RR   RR DDDDDD  
                                                                        


 */
// menu abonné
app.route('/dashboard', isLoggedIn).get((req, res) => {
  console.log(req.user)
  res.render('dashboard', {})
})

/*

RRRRRR  EEEEEEE  CCCCC  EEEEEEE IIIII PPPPPP  EEEEEEE  SSSSS  
RR   RR EE      CC    C EE       III  PP   PP EE      SS      
RRRRRR  EEEEE   CC      EEEEE    III  PPPPPP  EEEEE    SSSSS  
RR  RR  EE      CC    C EE       III  PP      EE           SS 
RR   RR EEEEEEE  CCCCC  EEEEEEE IIIII PP      EEEEEEE  SSSSS  
                                                              


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
    Ingredient.create(newIngredient, (err, _) => {
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


IIIII NN   NN   GGGG  RRRRRR  EEEEEEE DDDDD   IIIII EEEEEEE NN   NN TTTTTTT  SSSSS  
 III  NNN  NN  GG  GG RR   RR EE      DD  DD   III  EE      NNN  NN   TTT   SS      
 III  NN N NN GG      RRRRRR  EEEEE   DD   DD  III  EEEEE   NN N NN   TTT    SSSSS  
 III  NN  NNN GG   GG RR  RR  EE      DD   DD  III  EE      NN  NNN   TTT        SS 
IIIII NN   NN  GGGGGG RR   RR EEEEEEE DDDDDD  IIIII EEEEEEE NN   NN   TTT    SSSSS  
                                                                                    

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
          req.flash('success', `${updatedData.receipe} has been updated`)
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


FFFFFFF   AAA   VV     VV  OOOOO  UU   UU RRRRRR  IIIII TTTTTTT EEEEEEE  SSSSS  
FF       AAAAA  VV     VV OO   OO UU   UU RR   RR  III    TTT   EE      SS      
FFFF    AA   AA  VV   VV  OO   OO UU   UU RRRRRR   III    TTT   EEEEE    SSSSS  
FF      AAAAAAA   VV VV   OO   OO UU   UU RR  RR   III    TTT   EE           SS 
FF      AA   AA    VVV     OOOO0   UUUUU  RR   RR IIIII   TTT   EEEEEEE  SSSSS  
                                                                                

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
      flash('success', 'fav deleted')
      res.redirect('/dashboard/favourites')
    }
  })
})

/*
 SSSSS   CCCCC  HH   HH EEEEEEE DDDDD   UU   UU LL      EEEEEEE  SSSSS  
SS      CC    C HH   HH EE      DD  DD  UU   UU LL      EE      SS      
 SSSSS  CC      HHHHHHH EEEEE   DD   DD UU   UU LL      EEEEE    SSSSS  
     SS CC    C HH   HH EE      DD   DD UU   UU LL      EE           SS 
 SSSSS   CCCCC  HH   HH EEEEEEE DDDDDD   UUUUU  LLLLLLL EEEEEEE  SSSSS  
 */
app
  .route('/dashboard/schedule', isLoggedIn)
  .get((req, res) => {
    Schedule.find(
      {
        user: req.user.id,
      },
      (err, found) => {
        if (err) console.log(err)
        else {
          req.flash(
            'success',
            `${found.length} schedule${found.length > 1 ? 's' : ''} found`,
          )
          res.render('schedule', { schedules: found })
        }
      },
    )
  })
  .post((req, res) => {
    const newSchedule = {
      ReceipeName: req.body.receipename,
      ScheduleDate: req.body.scheduleDate,
      time: req.body.time,
      user: req.user.id,
    }
    Schedule.create(newSchedule, (err) => {
      if (err) console.log(err)
      else {
        res.redirect('/dashboard/schedule')
      }
    })
  })

app.get('/dashboard/schedule/newschedule', isLoggedIn, (_, res) => {
  res.render('newSchedule')
})
app.route('/dashboard/schedule/:id', isLoggedIn).get((req, res) => {
  Schedule.findOne({ _id: req.params.id }, (err, found) => {
    if (err) console.log(err)
    else {
      res.render('/dashboard/schedule/' + found._id, { schedule: found })
    }
  })
})

app.get('/dashboard/about', isLoggedIn, (_, res) => {
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

/* 

RRRRRR   OOOOO  UU   UU TTTTTTT IIIII NN   NN   GGGG  
RR   RR OO   OO UU   UU   TTT    III  NNN  NN  GG  GG 
RRRRRR  OO   OO UU   UU   TTT    III  NN N NN GG      
RR  RR  OO   OO UU   UU   TTT    III  NN  NNN GG   GG 
RR   RR  OOOO0   UUUUU    TTT   IIIII NN   NN  GGGGGG 
                                                      
 */

const PORT = 3000
app.listen(PORT, () => {
  console.log("Serveur à l'écoute... ")
  console.log(`port utilisé: ${PORT}`)
  console.log(`base de données: ${db}`)
})
