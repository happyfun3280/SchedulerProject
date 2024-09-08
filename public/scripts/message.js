(() => {
    let path = document.getElementById("path");

    let showMessageBtn = document.getElementById("show_message_btn");
    let messageFormBack = document.getElementById("message_form_back");
    let messageForm = document.getElementById("message_form");
    let messageReceiver = document.getElementById("message_receiver");
    let messageTitle = document.getElementById("message_title");
    let messageBody = document.getElementById("message_body");
    let messageBtn = document.getElementById("message_btn");
    
    let messageList = document.getElementById("message_list");
    let startpoint = 0;
    
    showMessageBtn.addEventListener('click', () => {
        messageFormBack.classList.remove("hidden");
    })
    
    messageFormBack.addEventListener('click', (e) => {
        if (e.target.id === "message_form_back") {
            messageFormBack.classList.add("hidden");
        }
    })
    
    messageBtn.addEventListener('click', () => {
        fetch(`/classes/my/${path.innerText}/message/add`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({
                receiver: parseInt(messageReceiver.value),
                title: messageTitle.value,
                body: messageBody.value
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                messageTitle.value = "";
                messageBody.value = "";
                messageFormBack.classList.add("hidden");
                initMessageList();
                startpoint = 0;
                renderMessageList();
            } else {
            }
        })
    })
    
    function initMessageList() {
        messageList.innerHTML = "";
    }
    
    function renderMessageList() {
        const number = 10;
        fetch(`/classes/my/${path.innerText}/message/get`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({
                start: startpoint,
                number: number,
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log(data);
                for (let message of data.messages) {
                    let contents = `<div class="message" value="${message.order}"><span class="title">${message.title}</span><span class="body">${message.body}</span>`;
                    if (message.isISender) {
                        contents += `<span class="name">to ${message.receiver}<span class="delete_btn">delete</span></span>`;
                    } else {
                        contents += `<span class="name">by ${message.sender}<span class="delete_btn">delete</span></span>`;
                    }
                    contents += `</div>`;
                    messageList.innerHTML += contents;
                }
                
                if (data.isNextMessage) {
                    messageList.innerHTML += `<div id="show_more_message_btn">more...</div>`;
                    let showMoreMessageBtn = document.getElementById("show_more_message_btn");
                    showMoreMessageBtn.addEventListener("click", (e) => {
                        showMoreMessageBtn.remove();
                        renderMessageList();
                    })
                }

                startpoint += data.messages.length;
                for (let i = 0; i < startpoint; i++) {
                    let message = document.getElementsByClassName("message")[i];
                    message.addEventListener("click", (e) => {
                        if (e.target.classList.contains("delete_btn")) {
                            fetch(`/classes/my/${path.innerText}/message/delete`, {
                                method: "POST",
                                headers: { "Content-Type" : "application/json" },
                                body: JSON.stringify({
                                    number: parseInt(message.getAttribute("value"))
                                })
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    message.remove();
                                    startpoint--;
                                }
                            })
                        } else {
                            message.classList.toggle("open");
                        }
                    })
                }
            }
        })
    }
    
    renderMessageList();
    
    })()