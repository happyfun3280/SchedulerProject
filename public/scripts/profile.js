(() => {

const path = document.getElementById("path");
const pushPermissionCheckBox = document.getElementById("push_permission");

fetch(`/classes/my/${path.innerText}/profile/push`, {
    method: "GET",
    headers: { "Content-Type" : "application/json" }
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        pushPermissionCheckBox.checked = data.permission;
    }
})

pushPermissionCheckBox.addEventListener("click", (e) => {
    fetch(`/classes/my/${path.innerText}/profile/push`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
            permission: e.target.checked
        })
    })
})

})()