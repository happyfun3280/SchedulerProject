const express = require("express");
const router = express.Router();

const userModel = require("../models/users.js");

const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var googleConfig = require('../config/google_config.json');
const { find } = require("../models/users.js");

passport.use(new GoogleStrategy({
        clientID: googleConfig.web.client_id,
        clientSecret: googleConfig.web.client_secret,
        callbackURL: googleConfig.web.redirect_uris[0],
        passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
        userModel.findOne({ email: profile.emails[0].value }, (err, user) => {
            if (user) {
                return done(err, user);
            } else {
                let user = {
                    google_id: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value
                }
                userModel(user).save(err => {
                    if (err) console.log(err);
                    return done(err, user);
                })
            }
        })
    }
));

router.get('/login/google',
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));

router.get('/login/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        return res.redirect('/classes');
    });

router.get('/logout', (req, res) => {
    if (!req.isLoggedIn()) return res.redirect("/login/google");
    if (typeof req.session.push_id === "string") {
        for (let key in req.user.push_token) {
            if (req.user.push_token[key].id === req.session.push_id) {
                userModel.findOne({ email: req.user.email })
                .then(user => {
                    user.push_token[key].permission = false;
                    user.save();
                })
                break;
            }
        }
    }
    req.logOut();
    delete req.session.push_id;
    res.redirect("/");
})

module.exports = router;