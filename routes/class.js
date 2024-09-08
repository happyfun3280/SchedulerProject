const express = require("express");
const router = express.Router();

const firebase_admin = require("firebase-admin");
const generate = require('nanoid/generate');


const userModel = require('../models/users.js');
const classModel = require('../models/classes.js');
const scheduleModel = require('../models/schedules.js');
const noticeModel = require('../models/notices.js');
const messageModel = require('../models/messages.js');

const pushModel = require('../models/pushes.js');
const notificationModel = require('../models/notifications.js');

const RightCtrl = require('../libs/rightCtrl.js');

{

    const time_gap = 12 * 60 * 60 * 1000; // 12 hours
    let current_time = new Date();
    let start_time = new Date(current_time.getFullYear(), current_time.getMonth(), current_time.getDate(), 18, 0, 0);
    if (start_time.getTime() < current_time.getTime()) {
        start_time.setTime(start_time.getTime() + time_gap);
    }

    function notification_callback() {
        const current_date = new Date();
        const year = current_date.getFullYear();
        const month = current_date.getMonth();
        const day = current_date.getDate();
        notificationModel.find({ reserve_date: new Date(year, month, day) })
        .then(notifications => {
            notificationModel.deleteMany({ reserve_date: new Date(year, month, day) })
            .then(result => {
                console.log(result);
            })
            for (let noti of notifications) {
                classModel.findOne({ class_id: noti.class_id })
                .then(objClass => {
                    scheduleModel.findById(objClass.schedule_id)
                    .then(scheduleDB => {
                        for (let schedule of scheduleDB.schedule_list) {
                            if (schedule.id === noti.schedule_id) {
                                for (let member of objClass.member_list) {
                                    if (member.push === true) {
                                        userModel.findOne({ email: member.email })
                                        .then(user => {
                                            for (let token_info of user.push_token) {
                                                if (token_info.permission) {
                                                    pushModel({
                                                        title: objClass.name,
                                                        body: `[schedule]${schedule.title}`,
                                                        push_id: token_info.id
                                                    }).save()
                                                    .then((push) => {
                                                        const checkMsg = { data: { id: push.id }, token: `${token_info.static_token}:${token_info.dynamic_token}` };
                                                        firebase_admin.messaging().send(checkMsg).then(res => {
                                                            console.log("res", res);
                                                        }).catch(err => {
                                                            console.log("err", err);
                                                        })
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    })
                })
            }
        });
        notificationModel.find({ reserve_date: new Date(year, month, day + 1) })
        .then(notifications => {
            for (let noti of notifications) {
                classModel.findOne({ class_id: noti.class_id })
                .then(objClass => {
                    scheduleModel.findById(objClass.schedule_id)
                    .then(scheduleDB => {
                        for (let schedule of scheduleDB.schedule_list) {
                            if (schedule.id === noti.schedule_id) {
                                for (let member of objClass.member_list) {
                                    if (member.push === true) {
                                        userModel.findOne({ email: member.email })
                                        .then(user => {
                                            for (let token_info of user.push_token) {
                                                if (token_info.permission) {
                                                    pushModel({
                                                        title: objClass.name,
                                                        body: `[schedule]${schedule.title}`,
                                                        push_id: token_info.id
                                                    }).save()
                                                    .then((push) => {
                                                        const checkMsg = { data: { id: push.id }, token: `${token_info.static_token}:${token_info.dynamic_token}` };
                                                        firebase_admin.messaging().send(checkMsg).then(res => {
                                                            console.log("res", res);
                                                        }).catch(err => {
                                                            console.log("err", err);
                                                        })
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    })
                })
            }
        });
    }

    setTimeout(() => {
        notification_callback();
        setInterval(notification_callback, time_gap);
    }, start_time.getTime() - current_time.getTime());

}

router.use('*', (req, res, next) => {
    if (!req.isLoggedIn()) return res.redirect("/login/google");
    next();
})

router.get('/', (req, res) => {
    (async () => {
        let class_list = [];
        for (let class_id of req.user.class_list) {
            class_list.push(await classModel.findOne({ class_id: class_id }));
        }
        return class_list;
    })()
    .then(class_list => {   
        res.render("classes.ejs", { user: req.user, classes: class_list });
    })
})

router.get('/join', (req, res) => {
    res.render("joinClass.ejs", { user: req.user });
})

router.post('/join', (req, res) => {
    let { code, class_nickname } = req.body;
    if (!req.isSameType(code, "string") || !req.isSameType(class_nickname, "string")) return res.redirect('/classes/join');
    if (!req.isRightLength(class_nickname, 3, 20)) return res.redirect('/classes/join');


    classModel.findOne({ invite_code: code })
    .then(objClass => {
        if (objClass) {
            for (let class_id of req.user.class_list) {
                if (class_id === objClass.class_id) return res.redirect('/classes/join');
            }
            objClass.member_list.push({
                email: req.user.email,
                nickname: req.htmlCleaner(class_nickname),
                right: new RightCtrl(0x1).getRight()
            });
            objClass.save();

            userModel.findOne({ email: req.user.email })
            .then(user => {
                user.class_list.push(objClass.class_id);
                user.save();
                return res.redirect('/classes');
            })
        } else {
            return res.redirect('/classes/join');
        }
    })
})

router.get('/create', (req, res) => {
    res.render("createClass.ejs", { user: req.user });
})

router.post('/create', (req, res) => {
    let { class_id, class_name, class_title, class_nickname } = req.body;
    if (!req.isSameType(class_id, "string") || !req.isSameType(class_name, "string") || !req.isSameType(class_title, "string") || !req.isSameType(class_nickname, "string")) return res.redirect('/classes/create');
    if (!req.isRightLength(class_id, 3, 20) || !req.isRightLength(class_name, 3, 20) || !req.isRightLength(class_nickname, 3, 20) || !req.isRightLength(class_nickname, 0, 150)) return res.redirect('/classes/create');
    if (!req.isClean("special_letter", req.body.class_id)) return res.redirect('/classes/create');

    classModel.findOne({ class_id: class_id })
    .then(sameIdClass => {
        if (sameIdClass) {
            return res.redirect('/classes/create');
        } else {
            (async () => {
                const schedule = await scheduleModel().save();
                const notice = await noticeModel().save();
                const message = await messageModel().save();
                
                let newInviteCode = "";
                while (true) {
                    newInviteCode = generate("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 10);
                    const sameCodeClass = await classModel.findOne({ invite_code: newInviteCode });
                    if (sameCodeClass === null) break;
                }

                let newClass = await classModel({
                    class_id: req.htmlCleaner(class_id),
                    name: req.htmlCleaner(class_name),
                    title: req.htmlCleaner(class_title),
                    invite_code: newInviteCode,
                    schedule_id: schedule.id,
                    notice_id: notice.id,
                    message_id: message.id,
                }).save();

                newClass.member_list.push({
                    email: req.user.email,
                    nickname: req.htmlCleaner(class_nickname),
                    right: new RightCtrl(0x10).getRight()
                })
                newClass.save();

                let user = await userModel.findOne({ email: req.user.email });
                user.class_list.push(newClass.class_id);
                user.save();
                
                return res.redirect('/classes');
            })()
        }
    })
})

router.get('/my/:class_id', (req, res) => {
    for (let class_id of req.user.class_list) {
        if (req.params.class_id === class_id) {
            return res.redirect(`/classes/my/${req.params.class_id}/schedule`);
        }
    }

    return res.redirect('/classes');
})

router.get('/my/:class_id/*', (req, res, next) => {
    for (let class_id of req.user.class_list) {
        if (req.params.class_id === class_id) {
            return next();
        }
    }
    return res.redirect('/classes');
})

router.get('/my/:class_id/profile', (req, res) => {
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        for (let member of objClass.member_list) {
            if (member.email === req.user.email) {
                return res.render("profile.ejs", { user: req.user, info: member, class_id: req.params.class_id, invite_code: objClass.invite_code });
            }
        }
    })
})

router.post('/my/:class_id/profile/nickname', (req, res) => {
    let { nickname } = req.body;
    if (!req.isSameType(nickname, "string") || !req.isRightLength(nickname, 3, 20)) return res.redirect(`/classes/my/${req.params.class_id}/profile`);
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        for (let key in objClass.member_list) {
            if (objClass.member_list[key].email === req.user.email) {
                objClass.member_list[key].nickname = req.htmlCleaner(nickname);
                objClass.save();
            }
        }
        return res.redirect(`/classes/my/${req.params.class_id}/profile`);
    })
})

router.get('/my/:class_id/profile/push', (req, res) => {
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        for (let member of objClass.member_list) {
            if (member.email === req.user.email) {
                return res.send({ success: true, permission: member.push });
            }
        }
        return res.send({ success: false });
    })
})

router.post('/my/:class_id/profile/push', (req, res) => {
    const { permission } = req.body;
    if (!req.isSameType(permission, "boolean")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        for (let member of objClass.member_list) {
            if (member.email === req.user.email) {
                member.push = permission;
                objClass.save();
            }
        }
        return res.send({ success: true });
    })
})

// !
router.post('/my/:class_id/profile/exit', (req, res) => {
    const { exit } = req.body;
    if (!req.isSameType(exit, "boolean")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
    })
})

router.get('/my/:class_id/schedule', (req, res) => {
    return res.render("schedule.ejs", { class_id: req.params.class_id });
})

router.get('/my/:class_id/notice', (req, res) => {
    return res.render("notice.ejs", { class_id: req.params.class_id });
})

router.get('/my/:class_id/message', (req, res) => {
    classModel.findOne({class_id: req.params.class_id})
    .then(objClass => {
        let member_list = objClass.member_list;
        for (let key in member_list) {
            if (member_list[key].email === req.user.email) {
                member_list[key] = null;
            }
        }
        return res.render("message.ejs", { class_id: req.params.class_id, members: member_list });
    })
})

router.post('/my/:class_id/*/add', (req, res, next) => {
    if (!req.isAjaxRequest()) return res.send({ success: false });
    for (let class_id of req.user.class_list) {
        if (class_id === req.params.class_id) return next();
    }
    return res.send({ success: false });
})

router.post('/my/:class_id/scheduler/add', (req, res) => {
    console.log(req.body);
    let { year, month, day, title } = req.body;
    if (!req.isSameType(year, "number") || !req.isSameType(month, "number") || !req.isSameType(day, "number")) return res.send({ success: false });
    if (!req.isSameType(title, "string")) return res.send({ success: false });
    if (!req.isRightLength(title, 3, 30) ) return res.send({ success: false });
    

    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        scheduleModel.findById(objClass.schedule_id)
        .then(scheduleDB => {
            let newSchedule = {
                order: objClass.schedule_count,
                title: req.htmlCleaner(title),
                create_member: req.user.email,
                schedule_date: new Date(year, month - 1, day)
            }
            scheduleDB.schedule_list.push(newSchedule);
            scheduleDB.save();

            objClass.schedule_count++;
            objClass.save();

            const current_date = new Date();
            let reserve_date = new Date(newSchedule.schedule_date);
            reserve_date.setHours(18);
            if (reserve_date > current_date) {
                notificationModel({
                    class_id: objClass.class_id,
                    schedule_id: scheduleDB.schedule_list[scheduleDB.schedule_list.length - 1].id,
                    reserve_date: newSchedule.schedule_date
                })
                .save();
            }

            return res.send({ success: true, title: newSchedule.title, order: newSchedule.order });
        })
    })
})

router.post('/my/:class_id/notice/add', (req, res) => {
    let { title, body } = req.body;
    if (!req.isSameType(title, "string") || !req.isSameType(body, "string")) return res.send({ success: false });
    if (!req.isRightLength(title, 3, 30) || !req.isRightLength(title, 0, 500)) return res.send({ success: false });

    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        noticeModel.findById(objClass.notice_id)
        .then(noticeDB => {
            let newNotice = {
                order: objClass.notice_count,
                title: req.htmlCleaner(title),
                body: req.htmlCleaner(body),
                create_member: req.user.email
            }
            noticeDB.notice_list.push(newNotice);
            noticeDB.save();

            objClass.notice_count++;
            objClass.save();

            (async () => {
                for (let member of objClass.member_list) {
                    if (!member.push) continue;
                    let user = await userModel.findOne({ email: member.email });
                    for (let token_info of user.push_token) {
                        if (!token_info.permission) continue;
                        const push = await pushModel({
                            title: objClass.name,
                            body: `[notice]${newNotice.title}`,
                            push_id: token_info.id
                        }).save();

                        const checkMsg = { data: { id: push.id }, token: `${token_info.static_token}:${token_info.dynamic_token}` };
                        firebase_admin.messaging().send(checkMsg).then(res => {
                            console.log("res", res);
                        }).catch(err => {
                            console.log("err", err);
                        })
                    }
                }
            })()

            return res.send({ success: true });
        })
    })
})

router.post('/my/:class_id/message/add', (req, res) => {
    let { receiver, title, body } = req.body;
    if (!req.isSameType(receiver, "number") || !req.isSameType(title, "string") || !req.isSameType(body, "string")) return res.send({ success: false });
    if (!req.isRightLength(title, 3, 30) || !req.isRightLength(body, 0, 500)) return res.send({ success: false });

    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        if (!objClass.member_list[receiver]) return res.send({ success: false });
        if (objClass.member_list[receiver].email === req.user.email) return res.send({ success: false });
        
        messageModel.findById(objClass.message_id)
        .then(messageDB => {
            let newMessage = {
                order: objClass.message_count,
                title: req.htmlCleaner(title),
                body: req.htmlCleaner(body),
                sender_member: req.user.email,
                receiver_member: objClass.member_list[receiver].email
            }
            messageDB.message_list.push(newMessage);
            messageDB.save();

            objClass.message_count++;
            objClass.save();

            return res.send({ success: true });
        })
    })
})

router.post('/my/:class_id/*/get', (req, res, next) => {
    if (!req.isAjaxRequest()) return res.send({ success: false });
    for (let class_id of req.user.class_list) {
        if (class_id === req.params.class_id) return next();
    }
    return res.send({ success: false });
})

router.post('/my/:class_id/scheduler/get', (req, res) => {
    const { month, year } = req.body;
    if (!req.isSameType(month, "number") || !req.isSameType(year, "number")) return res.send({ success: false });
    if (month < 0 || month > 11) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        scheduleModel.findById(objClass.schedule_id)
        .then(scheduleDB => {
            let schedules = [];
            for (let schedule of scheduleDB.schedule_list) {
                if (schedule.schedule_date.getFullYear() === year && schedule.schedule_date.getMonth() === month) {
                    schedules.push({
                        isMySchedule: schedule.create_member === req.user.email,
                        order: schedule.order,
                        title: schedule.title,
                        day: schedule.schedule_date.getDate()
                    });    
                }
            }
            return res.send({ success: true, schedules: schedules });
        })
    })
})

router.post('/my/:class_id/notice/get', (req, res) => {
    const { start, number } = req.body;
    if (!req.isSameType(start, "number") || !req.isSameType(number, "number")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        noticeModel.findById(objClass.notice_id)
        .then(noticeDB => {
            let notices = [];
            noticeDB.notice_list.reverse();
            let i;
            for (i = start; i < start + number; i++) {
                if (!noticeDB.notice_list[i]) break;
                
                let noticeInfo = {
                    order: noticeDB.notice_list[i].order,
                    title: noticeDB.notice_list[i].title,
                    body: noticeDB.notice_list[i].body,
                }

                for (let member of objClass.member_list) {
                    if (noticeDB.notice_list[i].create_member === member.email) {
                        noticeInfo.nickname = member.nickname;
                        break;
                    }
                }
                
                if (noticeDB.notice_list[i].create_member === req.user.email) {
                    noticeInfo.right = true;
                } else {
                    noticeInfo.right = false;
                }
                notices.push(noticeInfo);
            }

            let isNextNotice = false;
            if (noticeDB.notice_list[i]) {
                isNextNotice = true;
            }

            return res.send({ success: true, notices: notices, isNextNotice: isNextNotice });
        })
    })
})

router.post('/my/:class_id/message/get', (req, res) => {
    const { start, number } = req.body;
    if (!req.isSameType(start, "number") || !req.isSameType(number, "number")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        messageModel.findById(objClass.message_id)
        .then(messageDB => {
            let messages = [];
            messageDB.message_list.reverse();
            let i = skip = count = 0;
            let isNextMessage = false;
            while (true) {
                if (!messageDB.message_list[i]) break;
                if (count >= req.body.number) {
                    if (messageDB.message_list[i].sender_member === req.user.email || (messageDB.message_list[i].receiver_member === req.user.email && !messageDB.message_list[i].receiver_block)) {
                        isNextMessage = true;
                        break;
                    }
                    i++;
                    continue;
                }
                if (messageDB.message_list[i].sender_member === req.user.email || (messageDB.message_list[i].receiver_member === req.user.email && !messageDB.message_list[i].receiver_block)) {
                    if (skip < start) {
                        skip++;
                    } else {
                        messageInfo = {
                            order: messageDB.message_list[i].order,
                            title: messageDB.message_list[i].title,
                            body: messageDB.message_list[i].body
                        }

                        for (let member of objClass.member_list) {
                            if (messageDB.message_list[i].receiver_member === member.email) {
                                messageInfo.receiver = member.nickname;
                            } else if (messageDB.message_list[i].sender_member === member.email) {
                                messageInfo.sender = member.nickname;
                            }
                        }

                        if (messageDB.message_list[i].sender_member === req.user.email) messageInfo.isISender = true;
                        else messageInfo.isISender = false;
                        messages.push(messageInfo);
                        count++;
                    }
                }
                i++;
            }
            return res.send({ success: true, messages: messages, isNextMessage: isNextMessage });
        })
    })
})

router.post('/my/:class_id/*/update', (req, res, next) => {
    if (!req.isAjaxRequest()) return res.send({ success: false });
    for (let class_id of req.user.class_list) {
        if (class_id === req.params.class_id) return next();
    }
    return res.send({ success: false });
})

router.post('/my/:class_id/notice/update', (req, res) => {
    let { number, title, body } = req.body;
    if (!req.isSameType(number, "number") || !req.isSameType(title, "string") || !req.isSameType(body, "string")) return res.send({ success: false });
    if (!req.isRightLength(title, 3, 30) || !req.isRightLength(body, 0, 500)) return res.send({ success: false });
    
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        if (number >= objClass.notice_count) return res.send({ success: false });
        noticeModel.findById(objClass.notice_id)
        .then(noticeDB => {
            for (let key in noticeDB.notice_list) {
                if (noticeDB.notice_list[key].order === number && noticeDB.notice_list[key].create_member === req.user.email) {
                    noticeDB.notice_list[key].title = req.htmlCleaner(title);
                    noticeDB.notice_list[key].body = req.htmlCleaner(body);
                    noticeDB.save();
                    return res.send({ success: true });
                }
            }
            return res.send({ success: false });
        })
    })
})

router.post('/my/:class_id/*/delete', (req, res, next) => {
    if (!req.isAjaxRequest()) return res.send({ success: false });
    for (let class_id of req.user.class_list) {
        if (class_id === req.params.class_id) return next();
    }
    return res.send({ success: false });
})

router.post('/my/:class_id/schedule/delete', (req, res) => {
    let { number } = req.body;
    if (!req.isSameType(number, "number")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        if (number >= objClass.schedule_count) return res.send({ success: false });
        (async () => {
            let scheduleDB = await scheduleModel.findById(objClass.schedule_id);
            for (let key in scheduleDB.schedule_list) {
                if (scheduleDB.schedule_list[key].order === number && scheduleDB.schedule_list[key].create_member === req.user.email) {
                    scheduleDB.schedule_list.splice(key, 1);
                    scheduleDB.save();
                    return res.send({ success: true });
                }
            }
        })()
    })
})

router.post('/my/:class_id/notice/delete', (req, res) => {
    let { number } = req.body;
    if (!req.isSameType(number, "number")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        if (number >= objClass.notice_count) return res.send({ success: false });
        (async () => {
            let noticeDB = await noticeModel.findById(objClass.notice_id);
            for (let key in noticeDB.notice_list) {
                if (noticeDB.notice_list[key].order === number && noticeDB.notice_list[key].create_member === req.user.email) {
                    noticeDB.notice_list.splice(key, 1);
                    noticeDB.save();
                    return res.send({ success: true });
                }
            }
            return res.send({ success: false });
        })()
    })
})

router.post('/my/:class_id/message/delete', (req, res) => {
    let { number } = req.body;
    if (!req.isSameType(number, "number")) return res.send({ success: false });
    classModel.findOne({ class_id: req.params.class_id })
    .then(objClass => {
        if (number >= objClass.message_count) return res.send({ success: false });
        (async () => {
            let messageDB = await messageModel.findById(objClass.message_id);
            for (let key in messageDB.message_list) {
                if (messageDB.message_list[key].order === number) {
                    if (messageDB.message_list[key].receiver_member === req.user.email) {
                        messageDB.message_list[key].receiver_block = true;
                        messageDB.save();
                        return res.send({ success: true });
                    } else if (messageDB.message_list[key].sender_member === req.user.email) {
                        messageDB.message_list.splice(key, 1);
                        messageDB.save();
                        return res.send({ success: true });
                    }
                }
            }
            return res.send({ success: false });
        })()
    })
})

module.exports = router;