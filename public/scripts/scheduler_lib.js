const ROW_MAX = 6, COL_MAX = 7;
class scheduler {
    constructor(box, year, month, listeners) {
        this.calendar = new Array(ROW_MAX * COL_MAX);
        this.box = box;
        this.set(year, month);
        this.listeners = listeners;
    }

    get() {
        return this.calendar;
    }

    set(year, month) {
        this.year = year;
        this.month = month;
        this.maxday = this.getMaxday();
        this.firstDay = new Date(this.year, this.month - 1, 1).getDay();
        this.lastDay = 6 - new Date(this.year, this.month - 1, this.maxday).getDay();
        this.row = (this.firstDay + this.maxday + this.lastDay) / 7;
        this.create();
    }

    isLeapYear() {
        if (this.year % 4 === 0) {
            if (this.year % 100 === 0) {
                if (this.year % 400 === 0) {
                    return true;
                }
                return false;
            }
            return true;
        }
        return false;
    }

    getMaxday() {
        let maxday = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (this.isLeapYear(this.year)) maxday[1] = 29;
        return maxday[this.month - 1];
    }

    init() {
        for (let count = 0; count < this.calendar.length; count++) {
            this.calendar[count] = {
                day: 0,
                element: undefined,
                data: {}
            };
        }
    }

    create() {
        this.init();
        for (let count = 0; count < this.maxday; count++) {
            this.calendar[this.firstDay + count].day = count + 1;
        }
    }

    render() {
        let container = document.createElement("div");
        container.setAttribute("class", "clndr_container");

        let dayNameList = [ "일", "월", "화", "수", "목", "금", "토" ];
        let dayList = document.createElement("div");
        dayList.setAttribute("class", "clndr_day_list");
        for (let dayCount = 0; dayCount < 7; dayCount++) {
            let day = document.createElement("div");
            day.setAttribute("class", "clndr_day");
            day.innerText = dayNameList[dayCount];
            dayList.appendChild(day);
        }
        container.appendChild(dayList);

        let dateList = document.createElement("div");
        dateList.setAttribute("class", "clndr_date_list");
        for (let dateCount = 0; dateCount < this.firstDay; dateCount++) {
            let date = document.createElement("div");
            date.setAttribute("class", "clndr_empty");
            date.innerText = "-";
            dateList.appendChild(date);
        }
        for (let dateCount = 0; dateCount < this.maxday; dateCount++) {
            let date = document.createElement("div");
            date.setAttribute("class", "clndr_date");
            date.innerText = dateCount + 1;
            this.calendar[this.firstDay + dateCount].element = date;
            date.addEventListener("click", () => {
                let dateData = this.calendar[this.firstDay + dateCount];
                date.classList.toggle("clicked");
                this.sendEvent({ year: this.year, month: this.month, info: dateData });
            })
            dateList.appendChild(date);
        }
        for (let dateCount = 0; dateCount < this.lastDay; dateCount++) {
            let date = document.createElement("div");
            date.setAttribute("class", "clndr_empty");
            date.innerText = "-";
            dateList.appendChild(date);
        }
        container.append(dateList);
        this.box.appendChild(container);
    }

    sendEvent(data) {
        for (let listener of this.listeners) {
            listener.listen(data);
        }
    }
}

class scheduler_box {
    constructor() {

    }

    listen(data) {
        console.log(data);
    }
}

const newSchedulerBox = new scheduler_box();
const newScheduler = new scheduler(document.getElementById("calendar"), 2021, 10, [newSchedulerBox]);
newScheduler.render();

console.log(newScheduler);