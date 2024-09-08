const express = require("express");
const router = express.Router();

const firebase_admin = require("firebase-admin");

const userModel = require("../models/users.js");
const pushModel = require("../models/pushes.js");

router.use('*', (req, res, next) => {
    if (!req.isLoggedIn()) return res.redirect("/login/google");
    next();
})

router.get('/', (req, res) => {
    if (!req.isLoggedIn()) return res.redirect("/login/google");
    res.render("user.ejs", { user: req.user });
})

router.get('/push', (req, res, next) => {
    if (!req.isAjaxRequest()) return next();
    if (!req.isLoggedIn()) return res.send({});

    let msg = {};
    msg.isTokenExist = false;
    for (let key in req.user.push_token) {
        if (req.user.push_token[key].id === req.session.push_id)
        {
            msg.isTokenExist = true;
            msg.permission = req.user.push_token[key].permission;
            msg.token = `${req.user.push_token[key].static_token}:${req.user.push_token[key].dynamic_token}`;
        }
    }
    res.send(msg);
})

router.post('/push', (req, res, next) => {
    if (!req.isAjaxRequest()) return next();
    if (!req.isLoggedIn()) return res.send({ success: false });

    if (typeof req.body.permission === "boolean" && req.body.permission === false) {
        for (let key in req.user.push_token) {
            if (req.user.push_token[key].id === req.session.push_id) {
                userModel.findOne({ email: req.user.email })
                .then(user => {
                    user.push_token[key].permission = false;
                    user.save();
                })
                return res.send({ success: true });
            }
        }
        return res.send({ success: false });
    }
    else if (typeof req.body.token === "string") {
        const push_token = req.body.token.split(':');
        if (push_token.length !== 2 || push_token[0].length !== 22 || push_token[1].length !== 140) return res.send({ success: false });
    
        let isThereSameStaticToken = false;
        let key = 0;
        for (key in req.user.push_token) {
            if (req.user.push_token[key].static_token === push_token[0]) {
                isThereSameStaticToken = true;
                break;
            }
        }
    
        userModel.findOne({ email: req.user.email })
        .then(user => {
            if (isThereSameStaticToken) {
                user.push_token[key].dynamic_token = push_token[1];
                user.push_token[key].permission = true;
            } else {
                user.push_token.push({
                    static_token: push_token[0],
                    dynamic_token: push_token[1],
                    permission: true
                })
            }
            user.save();
            req.session.push_id = user.push_token[key].id;
            return res.send({ success: true });
        })
        .catch(err => {
            return res.send({ success: false });
        })
    }
    else {
        return res.redirect({ success: false });
    }
})

router.post('/push/send', (req, res) => {
    if (!req.isAjaxRequest()) return next();
    if (!req.isLoggedIn()) return res.send({});

    pushModel.findByIdAndDelete(req.body.info.data.id)
    .then(push => {
        if (push.push_id === req.session.push_id) {
            return res.send({
                success: true,
                title: push.title,
                body: push.body,
            })
        }
        else {
            return res.send({ sucess: false });
        }
    })
})

module.exports = router;