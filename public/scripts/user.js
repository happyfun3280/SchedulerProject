(() => {

    const push_right_checkbox = document.getElementById("push_right");
    const push_right_alert = document.getElementById("push_right_alert");
    const push_send_btn = document.getElementById("send_push");


    const firebaseConfig = {
        
    };
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    async function sendGET(path) {
        return await (await fetch(path, {
            method: "GET",
            headers: { "Content-Type" : "application/json" },
        })).json();
    }

    async function sendPOST(path, data = {}) {
        return await (await fetch(path, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify(data)
        })).json();
    }

    sendGET('/user/push')
    .then(data => {
        if (data.isTokenExist && data.permission && Notification.permission === "granted")
        {
            messaging.getToken()
            .then(token => {
                if (token === data.token) {
                    push_right_checkbox.checked = true;
                }
            })
        }
    })

    push_right_checkbox.addEventListener("change", (event) => {
        if (event.target.checked) {
            switch (Notification.permission) {
                case "default":
                    Notification.requestPermission(result => {
                        if (result === "granted") {
                            messaging.getToken()
                            .then(token => {
                                sendPOST('/user/push', {
                                    token: token
                                })
                                .then(result => {
                                    if (!result.success) {
                                        push_right_checkbox.checked = false;
                                    }
                                })
                            })
                        } else {
                            push_right_checkbox.checked = false;
                        }
                    })
                    break;
                case "granted":
                    messaging.getToken()
                    .then(token => {
                        sendPOST('/user/push', {
                            token: token
                        })
                        .then(result => {
                            if (!result.success) {
                                push_right_checkbox.checked = false;
                            }
                        })
                    })
                    break;
                case "denied":
                    push_right_checkbox.checked = false;
                    push_right_alert.innerText = "푸시 알림 차단 설정을 해제해주세요.";
                    break;
            }
        } else {
            sendPOST('/user/push', {
                permission: false
            })
            .then(result => {
                if (!result.success) {
                    push_right_checkbox.checked = true;
                    push_right_alert.innerText = "처리하는 중에 에러가 발생하였습니다.";
                }
            })
        }
    })

    push_send_btn.addEventListener("click", (event) => {
        sendGET('/user/push/check');
    })
    
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
                push_right_alert.innerText = data.body;
                return navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations[0].showNotification(title, options);
                  });
            } else {
    
            }
        })
    });
})();