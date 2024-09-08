// * Main server startpoint
// TODO Renew domain(checkyou.cf) every 12 months in freenom.com
const express = require("express");
const app = express();

const appConfig = require("./config/app_config.json");
const port = process.env.PORT || appConfig.app.port;

const fs = require("fs");

const mongoose = require("mongoose");
mongoose.connect(appConfig.mongo.connect)
.then(() => console.log(`|  Connected  | Port Number - ${appConfig.mongo.port} | mongoDB`))
.catch((err) => console.log(err));

const session = require("express-session");
const MongoStore = require("connect-mongo");
app.use(session({
    secret: appConfig.session.secret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: appConfig.mongo.connect }),
    cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 86400000*365
    }
}))

const crypto = require("crypto");
    
const helmet = require("helmet");
app.use(helmet());
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
    next();
});
app.use(helmet.contentSecurityPolicy({
    directives : {
        defaultSrc : ["'self'", "*.googleapis.com" ],
        styleSrc : ["'self'", "*.googleapis.com" ],
        scriptSrc : ["'self'", "*.gstatic.com", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        imgSrc : ["'self'"],
        fontSrc : ["'self'", "*.gstatic.com" ]
    }
}))

const ejs = require("ejs");
app.set("view engine", "ejs");
app.set("views", "./views");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Https connection completed('./public/well-known/...' & './config/letsencrypt/...' forders related to https)
// TODO Renew a certificate every 90 days. (letsencrypt.com)
const https = require("https");
const sslOptions = {
    ca: fs.readFileSync('./config/letsencrypt/checkyou.cf-chain.pem'),
    key: fs.readFileSync('./config/letsencrypt/checkyou.cf-key.pem'),
    cert: fs.readFileSync('./config/letsencrypt/checkyou.cf-crt.pem')
}

const firebase_admin = require("firebase-admin");
let serAccount = require("./config/firebase-key.json");
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serAccount) 
})

// ? How to embody firebase push message system?
{ 
/*
=> Embody server side
* Push message box
var message = { data: { title: PUSH_TITLE, body: PUSH_BODY, ... }, token: USER_TOKEN, ... }
* Sending push message
firebase_admin.messaging().send(message).then((res) => { ... }).catch((err) => { ... })
* '/public/firebase-messaging-sw.js' file is pushMessage service worker
!EDIT * '' file request notification permission & get user token

=> Embody client side (HTML)
<script src="https://www.gstatic.com/firebasejs/8.8.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.8.1/firebase-messaging.js"></script>

=> Embody client side (JavaScript)
* Firebase Configuration
const firebaseConfig = {

};
* Firebase Init
firebase.initializeApp(firebaseConfig);
* Get Messaging Api
const messaging = firebase.messaging();
* Get Push Message Permission
messaging.requestPermission().then(() => { return messaging.getToken(); }).then((token) => { ... }).catch(() => { ... })
* Send Push Message
messaging.onMessage((payload) => {
    var notification = new Notification(payload.data.title, { body: payload.data.body });
})

=> Embody client side (JavaScript ServiceWorker)
importScripts("https://www.gstatic.com/firebasejs/8.8.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.8.1/firebase-messaging.js");
...
* Send Background Push Message
messaging.setBackgroundMessageHandler((payload) => { return self.registration.showNotification(payload.data.title, { body: payload.data.body }) })
*/
}

const userModel = require("./models/users.js");

app.use(express.static('public'));

var passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    return done(null, user.email);
});

passport.deserializeUser(function(email, done) {
    userModel.findOne({ email: email }, function(err, user) {
        return done(err, user);
    });
});

const signRouter = require('./routes/auth.js');
const userRouter = require('./routes/user.js');
const classRouter = require('./routes/class.js');

app.use((req, res, next) => {
    req.isAjaxRequest = () => {
        return req.get('sec-fetch-dest') === "empty";
    }
    req.isLoggedIn = () => {
        return !(!req.user);
    }
    req.htmlCleaner = (dirty) => {
        return dirty.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    req.isClean = (mode, string) => {
        switch (mode) {
            case "special_letter":
                return /[a-zA-Z0-9]/g.test(string);
        }
    }
    req.isSameType = (value, type) => {
        return typeof value === type;
    }
    req.isRightLength = (str, min, max) => {
        return str.length >= min && str.length <= max;
    }
    next();
})

// Main
app.get("/", (req, res) => {
    res.render("main.ejs", { user: req.user });
})

app.use('/', signRouter);
app.use('/user', userRouter);
app.use('/classes', classRouter);

app.use((req, res) => {
    res.status(404).render("404.ejs", { user: req.user });
});

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`| Server Open | Port Number - ${port}  | Domain Name - checkyou.cf`);
})