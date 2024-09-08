(() => {

let path = document.getElementById("path");

let showNoticeBtn = document.getElementById("show_notice_btn");
let noticeFormBack = document.getElementById("notice_form_back");
let noticeForm = document.getElementById("notice_form");
let noticeTitle = document.getElementById("notice_title");
let noticeBody = document.getElementById("notice_body");
let noticeBtn = document.getElementById("notice_btn");

let udpateId = -1;
let noticeUpdateFormBack = document.getElementById("notice_update_form_back");
let noticeUpdateForm = document.getElementById("notice_update_form");
let noticeUpdateTitle = document.getElementById("notice_update_title");
let noticeUpdateBody = document.getElementById("notice_update_body");
let noticeUpdateBtn = document.getElementById("notice_update_btn");

let noticeList = document.getElementById("notice_list");
let startpoint = 0;

showNoticeBtn.addEventListener('click', () => {
    noticeFormBack.classList.remove("hidden");
})

noticeFormBack.addEventListener('click', (e) => {
    if (e.target.id === "notice_form_back") {
        noticeFormBack.classList.add("hidden");
    }
})

noticeUpdateFormBack.addEventListener('click', (e) => {
    if (e.target.id === "notice_update_form_back") {
        noticeUpdateFormBack.classList.add("hidden");
    }
})

noticeBtn.addEventListener('click', () => {
    fetch(`/classes/my/${path.innerText}/notice/add`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
            title: noticeTitle.value,
            body: noticeBody.value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            noticeTitle.value = "";
            noticeBody.value = "";
            noticeFormBack.classList.add("hidden");
            initNoticeList();
            startpoint = 0;
            renderNoticeList();
        } else {
        }
    })
})

noticeUpdateBtn.addEventListener('click', () => {
    fetch(`/classes/my/${path.innerText}/notice/update`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
            number: updateId,
            title: noticeUpdateTitle.value,
            body: noticeUpdateBody.value
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            noticeUpdateTitle.value = "";
            noticeUpdateBody.value = "";
            noticeUpdateFormBack.classList.add("hidden");
            initNoticeList();
            startpoint = 0;
            renderNoticeList();
        } else {
        }
    })
})

function initNoticeList() {
    noticeList.innerHTML = "";
}

function renderNoticeList() {
    const number = 10;
    fetch(`/classes/my/${path.innerText}/notice/get`, {
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
            for (let notice of data.notices) {
                noticeList.innerHTML += `<div class="notice" value="${notice.order}">
                <span class="title">${notice.title}</span>
                <span class="body">${notice.body}</span>
                <span class="name">${notice.right ? `<span class="update_btn">update</span><span class="delete_btn">delete</span>` : notice.nickname}</span>
                </div>`;
            }

            if (data.isNextNotice) {
                noticeList.innerHTML += `<div id="show_more_notice_btn">more...</div>`;
                let showMoreNoticeBtn = document.getElementById("show_more_notice_btn");
                showMoreNoticeBtn.addEventListener("click", (e) => {
                    showMoreNoticeBtn.remove();
                    renderNoticeList();
                })
            }

            startpoint += data.notices.length;
            for (let i = 0; i < startpoint; i++) {
                let notice = document.getElementsByClassName("notice")[i];
                notice.addEventListener("click", (e) => {
                    if (e.target.classList.contains("delete_btn")) {
                        fetch(`/classes/my/${path.innerText}/notice/delete`, {
                            method: "POST",
                            headers: { "Content-Type" : "application/json" },
                            body: JSON.stringify({
                                number: parseInt(notice.getAttribute("value"))
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                notice.remove();
                                startpoint--;
                            }
                        })
                    } else if (e.target.classList.contains("update_btn")) {
                        noticeUpdateFormBack.classList.remove("hidden");
                        noticeUpdateTitle.value = notice.querySelector("span.title").innerText;
                        noticeUpdateBody.value = notice.querySelector("span.body").innerText;
                        updateId = parseInt(notice.getAttribute("value"));
                    } else {
                        notice.classList.toggle("open");
                    }
                })
            }
        }
    })
}

renderNoticeList();

})()