importScripts("https://www.gstatic.com/firebasejs/8.8.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.8.1/firebase-messaging.js");

const firebaseConfig = {

};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
    fetch('/user/push/send', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            info: payload
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let title = data.title;
            let options = {
                body: data.body
            }
            return self.registration.showNotification(title, options);
        } else {

        }
    })
})