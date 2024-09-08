(() => {
const firebaseConfig = {

};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onMessage((payload) => {
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
            return navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations[0].showNotification(title, options);
              });
        } else {

        }
    })
});
})()