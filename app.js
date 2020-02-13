//jshint esversion:6

//.....................................................................level 6 security usin passport and google.........................................................


require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose= require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
//just below above ones
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
//just above .connect
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    //userProfileURL: "http://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);


//new mongoose is used because if we directly create a schema it will inherit default property only but here it would alter its properties as per user defined properties
const userSchema =new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get("/",function(req,res){
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");
    
})


app.get("/register",function(req,res){
    res.render("register");
    
})

app.get("/secrets",function(req,res){
    //a mongodb function to check out those fields which have value and are not null
   User.find({"secret":{$ne: null}},function(err,foundUSer){
       if(err){
           console.log(err)
       }else{
           if(foundUSer){
               res.render("secrets",{userWithSecrets: foundUSer})
           }
       }
   });
});
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        console.log("thisisworking");
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id,function(err, foundUSer){
        if(err){
            console.log(err);
        }else{
            if(foundUSer){
                foundUSer.secret=submittedSecret;
                foundUSer.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/login");
})
app.post("/register",function(req,res){
    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })

});

app.post("/login",function(req,res){
    const user=new User({
    username:req.body.username,
    password:req.body.password
    });
    req.login(user, function(err){
        if(err){
        console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});



app.listen(3000,function(){
    console.log("Server set on port 3000");
});

//.............................................level 1 security by making secret variable here.....................................................

//"npm i mongoose-encryption"->to install package

// const encrypt= require("mongoose-encryption");

// const userSchema =new mongoose.Schema({
//     email: String,
//     password: String
// });


// // this secret variable is used with the encryption to jumble up the code with it
// //caution->this secret variable is very imp. because it can also be used by hackers to decrypt the text and hack the password
// const secret="thisisourlittlesecret";

// //this line would install plugins to encrypt the text in variable password
// userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});

// app.post("/register",function(req,res){
//         const newUser = new User({
//             email: req.body.username,
//             password: req.body.password
//         })
//         newUser.save(function(err){
//             if(err){
//                 console.log(err);
//             }else{
//                 res.render("secrets")
//             }
//         });
//     });

// app.post("/login",function(req,res){
//     const username= req.body.username;
//     const password= req.body.password;

//     User.findOne({email: username},function(err, foundUSer){
//         if(err){
//             console.log(err);
//         }else{
//             if(foundUSer){
//                 if(password===foundUSer.password) {
//                 res.render("secrets");
//                 }
                
                
//             }
//         }
//     })
// })


//.............................................level 2 security using encrypt(secret in .env file).................................................

//"npm i mongoose-encryption"->to install package
//"npm i dotenv"->to install dotenvpackage
//"touch .env"->to create env secret file
//"SECRET=thisisoursecret"->paste same in env file

//require('dotenv').config()
// const encrypt= require("mongoose-encryption");
////new mongoose is used because if we directly create a schema it will inherit default property only but here it would alter its properties as per user defined properties
// const userSchema =new mongoose.Schema({
//     email: String,
//     password: String
// });
//userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]});

// app.post("/register",function(req,res){
//         const newUser = new User({
//             email: req.body.username,
//             password: req.body.password
//         })
//         newUser.save(function(err){
//             if(err){
//                 console.log(err);
//             }else{
//                 res.render("secrets")
//             }
//         });
//     });

// app.post("/login",function(req,res){
//     const username= req.body.username;
//     const password= req.body.password;

//     User.findOne({email: username},function(err, foundUSer){
//         if(err){
//             console.log(err);
//         }else{
//             if(foundUSer){
//                 if(password===foundUSer.password) {
//                 res.render("secrets");
//                 }
                
                
//             }
//         }
//     })
// })



//.............................................level 3 security using MD5(hash functions)..........................................................

////"npm i md5"->to install md5 package


//var md5 = require('md5');
//console.log(md5("123456"));
// app.post("/register",function(req,res){
//         const newUser = new User({
//             email: req.body.username,
//             password: md5(req.body.password)
//         })
//         newUser.save(function(err){
//             if(err){
//                 console.log(err);
//             }else{
//                 res.render("secrets")
//             }
//         });
//     });

// app.post("/login",function(req,res){
//     const username= req.body.username;
//     const password= req.body.password;

//     User.findOne({email: username},function(err, foundUSer){
//         if(err){
//             console.log(err);
//         }else{
//             if(foundUSer){
//                 if(md5(password)===foundUSer.password) {
//                 res.render("secrets");
//                 }
                
                
//             }
//         }
//     })
// })

//...............................................level 4 security using bcrypt.....................................................................

//"npm i bcrypt"->to install bycrypt package


// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// app.post("/register",function(req,res){
//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         // Store hash in your password DB.
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         })
//         newUser.save(function(err){
//             if(err){
//                 console.log(err);
//             }else{
//                 res.render("secrets")
//             }
//         });
//     });

// });

// app.post("/login",function(req,res){
//     const username= req.body.username;
//     const password= req.body.password;

//     User.findOne({email: username},function(err, foundUSer){
//         if(err){
//             console.log(err);
//         }else{
//             if(foundUSer){
//                 bcrypt.compare(password, foundUSer.password, function(err, result) {
//                     //if( result ===  true){
//                     res.render("secrets");
//                     //}
//                 });
                
                
//             }
//         }
//     })
// })

//...............................................level 5 security using bcrypt.....................................................................

//"npm i passport passport-local passport-local-mongoose express-session"