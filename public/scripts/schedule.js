(() => {

let path = document.getElementById("path");

let calendar = document.getElementById("calendar");
let currentDate = document.getElementById("current_date");

let dayOfSchedules = document.getElementById("dayOfSchedules");
let selectedDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

let scheduleFormBack = document.getElementById("schedule_form_back");
let scheduleTitle = document.getElementById("schedule_title");
let scheduleBtn = document.getElementById("schedule_btn");


scheduleFormBack.addEventListener('click', (e) => {
    if (e.target.id === "schedule_form_back") {
        scheduleFormBack.classList.add("hidden");
    }
})

scheduleBtn.addEventListener("click", () => {
    const [ year, month, day ] = selectedDate.split("-");
    fetch(`/classes/my/${path.innerText}/scheduler/add`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            title: scheduleTitle.value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            scheduleTitle.value = "";
            scheduleFormBack.classList.add("hidden");
            calendar.querySelector(`span#calendar_${day} > .schedule_list`).innerHTML += `<span class="schedule" value="${data.order} true">${data.title}</span>`;
            dayOfSchedules.innerHTML += `<span class="schedule" value="${data.order} true">${data.title}</span>`;
            
            let schedule_list = dayOfSchedules.querySelectorAll("span.schedule");
            let schedule = schedule_list[schedule_list.length - 1];
            let [ order, right ] = schedule.getAttribute("value").split(" ");
                    
            dayOfSchedules.querySelector("button#schedule_add_btn").addEventListener("click", () => {
                scheduleFormBack.classList.remove("hidden");
            })
            if (right) {
                schedule.innerHTML += `<button value="${order}" class="schedule_delete_btn">delete</button>`;
                schedule.querySelector("button.schedule_delete_btn").addEventListener("click", (e) => {
                    fetch(`/classes/my/${path.innerText}/schedule/delete`, {
                        method: "POST",
                        headers: { "Content-Type" : "application/json" },
                        body: JSON.stringify({
                            number: parseInt(order)
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            document.querySelector(`#calendar .schedule[value~="${order}"]`).remove();
                                schedule.remove();
                        }
                    })
                })
            }
        } else {
        }
    })
})

function isLeapYear(year) {
    if (year % 4 === 0) {
        if (year % 100 === 0) {
            if (year % 400 === 0) {
                return true;
            }
            return false;
        }
        return true;
    }
    return false;
}

function maxdayOfMonth(year, month) {
    let maxday_year = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let maxday_leap_year = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (isLeapYear(year)) {
        return maxday_leap_year[month - 1];
    } else {
        return maxday_year[month - 1];
    }
}

function createCalendar(year, month) {
    let maxday = maxdayOfMonth(year, month);
    let firstDay = new Date(year, month - 1, 1);
    let lastDay = new Date(year, month - 1, maxday);
    let curCalendar = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
        curCalendar.push(0);
    }

    for (let i = 0; i < maxday; i++) {
        curCalendar.push(i + 1);
    }

    if (lastDay !== 6) {
        for (let i = 0; i < 6 - lastDay.getDay(); i++) {
            curCalendar.push(0);
        }
    }

    return curCalendar;
}

function renderCalendar(calendar, year, month) {
    let month_list = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    let day_list = ["일", "월", "화", "수", "목", "금", "토"];

    let dayOfMonthList = createCalendar(year, month);
    let COL = 7;
    let ROW = dayOfMonthList.length / COL;

    calendar.innerHTML = "";

    for (let col = 0; col < COL; col++) {
        let dayOfWeek = document.createElement("span");
        dayOfWeek.innerText = day_list[col];
        dayOfWeek.classList.add("calendarDayOfWeek");
        calendar.appendChild(dayOfWeek);
    }
    for (let row = 0; row < ROW; row++) {
        for (let col = 0; col < COL; col++) {
            let day = document.createElement("span");
            if (dayOfMonthList[COL * row + col] === 0) {
            } else {
                day.innerHTML = `<div class="day_numbering">${dayOfMonthList[COL * row + col]}</div><div class="schedule_list"></div>`;
                day.setAttribute("id", `calendar_${dayOfMonthList[COL * row + col]}`);
                switch (new Date(year, month - 1, dayOfMonthList[COL * row + col]).getDay()) {
                    case 0:
                        day.classList.add("calendarSunday");
                        break;
                    case 6:
                        day.classList.add("calendarSaturday");
                        break;
                }
                day.setAttribute("value", `${year}-${month}-${dayOfMonthList[COL * row + col]}`);
                day.addEventListener("click", (e) => {
                    for (let days of document.querySelectorAll(".clicked")) days.classList.remove("clicked");
                    day.classList.add("clicked");
                    let schedule_list = day.querySelector("div.schedule_list");
                    dayOfSchedules.innerHTML = `<div class="dayOfSchedules_date">${day.getAttribute("value")}<button id="schedule_add_btn">add +</button></div>`;
                    selectedDate = day.getAttribute("value");
                    dayOfSchedules.innerHTML += schedule_list.innerHTML;
                    let scheduleAddBtn = dayOfSchedules.querySelector("button#schedule_add_btn");
                    scheduleAddBtn.addEventListener("click", () => {
                        scheduleFormBack.classList.remove("hidden");
                    })
                    for (let schedule of dayOfSchedules.querySelectorAll("span.schedule")) {
                        let [ order, right ] = schedule.getAttribute("value").split(" ");
                        if (right) {
                            schedule.innerHTML += `<button value="${order}" class="schedule_delete_btn">delete</button>`;
                            schedule.querySelector("button.schedule_delete_btn").addEventListener("click", (e) => {
                                fetch(`/classes/my/${path.innerText}/schedule/delete`, {
                                    method: "POST",
                                    headers: { "Content-Type" : "application/json" },
                                    body: JSON.stringify({
                                        number: parseInt(order)
                                    })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        document.querySelector(`#calendar .schedule[value~="${order}"]`).remove();
                                        schedule.remove();
                                    }
                                })
                            })
                        }
                    }
                })
            }
            calendar.appendChild(day);
        }
    }

    calendar.style.grid = `50px repeat(${ROW}, 2fr) / repeat(7, 1fr)`;
}

function renderDate(element, year, month) {
    if (month > 9) {
        element.innerText = `${year}. ${month}.`;
    } else {
        element.innerText = `${year}. 0${month}.`;
    }
}

function setSchedules(year, month) {
    fetch(`/classes/my/${path.innerText}/scheduler/get`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
            year: year,
            month: month - 1
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log(data);
            for (let schedule of data.schedules) {
                let calendar_day = document.getElementById(`calendar_${schedule.day}`).querySelector("div.schedule_list");
                calendar_day.innerHTML += `<span class="schedule" value="${schedule.order} ${schedule.isMySchedule}">${schedule.title}</span>`;
                if (calendar_day.children.length > 2) calendar_day.classList.add("lot");
            }
        }
    })
}


let date = new Date();

let year = date.getFullYear();
let month = date.getMonth() + 1;

renderCalendar(calendar, year, month);
renderDate(currentDate, year, month);
setSchedules(year, month);

document.getElementById("calendar_move_left").addEventListener("click", () => {
    month--;
    if (month < 1) {
        month = 12;
        year--;
    }
    renderCalendar(calendar, year, month);
    renderDate(currentDate, year, month);
    setSchedules(year, month);
})

document.getElementById("calendar_move_right").addEventListener("click", () => {
    month++;
    if (month > 12) {
        month = 1;
        year++;
    }
    renderCalendar(calendar, year, month);
    renderDate(currentDate, year, month);
    setSchedules(year, month);
})
})();