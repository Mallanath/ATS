var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ExpressionBlocker } from "../common/blocking_expressions.js";
import { DateUtils } from "../utils/date.js";
import { Serializer } from "../utils/serializer.js";
import { DayTime, DaysUtils, TimeRange, TimeUtils } from "./time.js";
import { Lang } from "../utils/translate.js";
export var ScheduleIconType;
(function (ScheduleIconType) {
    ScheduleIconType["Clock"] = "Clock";
    ScheduleIconType["School"] = "School";
    ScheduleIconType["SchoolBuilding"] = "SchoolBuilding";
    ScheduleIconType["Laptop"] = "Laptop";
    ScheduleIconType["Home"] = "Home";
    ScheduleIconType["Playground"] = "Playground";
    ScheduleIconType["Sleeping"] = "Sleeping";
    ScheduleIconType["Books"] = "Books";
    ScheduleIconType["Calendat"] = "Calendat";
    ScheduleIconType["BookShelf"] = "BookShelf";
    ScheduleIconType["Classroom"] = "Classroom";
    ScheduleIconType["Location"] = "Location";
    ScheduleIconType["Lock"] = "Lock";
    ScheduleIconType["Hourglass"] = "Hourglass";
    ScheduleIconType["Sleep"] = "Sleep";
    ScheduleIconType["Tools"] = "Tools";
    ScheduleIconType["Car"] = "Car";
    ScheduleIconType["Dumbell"] = "Dumbell";
    ScheduleIconType["Basketball"] = "Basketball";
    ScheduleIconType["Gas"] = "Gas";
    ScheduleIconType["Beachball"] = "Beachball";
    ScheduleIconType["Pizza"] = "Pizza";
    ScheduleIconType["DogBone"] = "DogBone";
    ScheduleIconType["Hearth"] = "Hearth";
    ScheduleIconType["Accounting"] = "Accounting";
    ScheduleIconType["Forest"] = "Forest";
    ScheduleIconType["Bat"] = "Bat";
    ScheduleIconType["Bicycle"] = "Bicycle";
    ScheduleIconType["Pen"] = "Pen";
    ScheduleIconType["Journal"] = "Journal";
    ScheduleIconType["Cat"] = "Cat";
    ScheduleIconType["RuckSack"] = "RuckSack";
    ScheduleIconType["Skull"] = "Skull";
    ScheduleIconType["Briefcase"] = "Briefcase";
    ScheduleIconType["Strawberry"] = "Strawberry";
    ScheduleIconType["Poo"] = "Poo";
    ScheduleIconType["Star"] = "Star";
    ScheduleIconType["ShushingFace"] = "ShushingFace";
    ScheduleIconType["Idea"] = "Idea";
    ScheduleIconType["Sakura"] = "Sakura";
    ScheduleIconType["Stones"] = "Stones";
    ScheduleIconType["Leaf"] = "Leaf";
    ScheduleIconType["Game"] = "Game";
    ScheduleIconType["Shopaholic"] = "Shopaholic";
    ScheduleIconType["Cheesecake"] = "Cheesecake";
    ScheduleIconType["MoneyMouth"] = "MoneyMouth";
    ScheduleIconType["CoinWallet"] = "CoinWallet";
    ScheduleIconType["Corn"] = "Corn";
    ScheduleIconType["Goal"] = "Goal";
    ScheduleIconType["News"] = "News";
    ScheduleIconType["Night"] = "Night";
    ScheduleIconType["Web"] = "Web";
    ScheduleIconType["Chat"] = "Chat";
    ScheduleIconType["Beach"] = "Beach";
    ScheduleIconType["Math"] = "Math";
    ScheduleIconType["Wifi"] = "Wifi";
    ScheduleIconType["Rocket"] = "Rocket";
})(ScheduleIconType || (ScheduleIconType = {}));
export var ScheduleTimeExecutionMode;
(function (ScheduleTimeExecutionMode) {
    ScheduleTimeExecutionMode["daily"] = "daily";
    ScheduleTimeExecutionMode["intervals"] = "intervals";
})(ScheduleTimeExecutionMode || (ScheduleTimeExecutionMode = {}));
var Schedule = /** @class */ (function (_super) {
    __extends(Schedule, _super);
    function Schedule() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = Date.now();
        _this.isEnabled = true;
        _this.pauseUntil = new Date();
        _this.pauseStart = new Date();
        _this.name = "";
        _this.timeRanges = [new TimeRange()];
        _this.days = new Set([]);
        _this.executionMode = ScheduleTimeExecutionMode.daily;
        _this.icon = ScheduleIconType.Clock;
        _this.unlockedUntil = new Date();
        return _this;
    }
    Object.defineProperty(Schedule.prototype, "nonEmptyName", {
        get: function () {
            if (this.name && this.name.length > 0) {
                return this.name;
            }
            return "Schedule";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "_isActiveDay", {
        get: function () {
            var now = new Date();
            var today = DaysUtils.fromJsIndex(now.getDay());
            return (this.days.has(today) /* or previous day + 1*/);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "isPaused", {
        get: function () {
            return this.pauseUntil != null && (new Date() < this.pauseUntil);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "isUnlocked", {
        get: function () {
            return this.unlockedUntil != null && (new Date() < this.unlockedUntil);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "getTotalTime", {
        get: function () {
            var time = 0;
            if (this.executionMode === ScheduleTimeExecutionMode.daily) {
                time = this.days.size * 24 * 60;
            }
            if (this.executionMode === ScheduleTimeExecutionMode.intervals) {
                this.timeRanges.forEach(function (timeRange) {
                    var endMinutes = timeRange.end.hour * 60 + timeRange.end.minutes;
                    var startMinutes = timeRange.start.hour * 60 + timeRange.start.minutes;
                    time += (endMinutes - startMinutes);
                });
                time *= this.days.size;
            }
            return time;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "getAllWeekTime", {
        get: function () {
            //7 days * 24hours * 60 minutes;
            return 7 * 24 * 60;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "isActive", {
        get: function () {
            if (this.totalExpressionsCount === 0) {
                return false;
            }
            if (this.isEnabled && !this.isPaused) {
                switch (this.executionMode) {
                    case ScheduleTimeExecutionMode.daily:
                        return this._isActiveDay;
                    case ScheduleTimeExecutionMode.intervals:
                        return this.activeTimeRanges.length > 0;
                }
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "activeTimeRanges", {
        get: function () {
            var _this = this;
            var _a;
            var now = new Date();
            var ranges = [];
            // if (this._isActiveDay) {
            var isActiveDay = this._isActiveDay;
            var yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            var tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            ranges = (_a = Array.from(this.timeRanges)) === null || _a === void 0 ? void 0 : _a.filter(function (e) {
                var activeDates = TimeUtils.getActiveDates(now, e, _this.days);
                if (activeDates) {
                    return TimeUtils.isActive(activeDates);
                }
                return false;
            });
            //}
            return ranges;
        },
        enumerable: false,
        configurable: true
    });
    Schedule.prototype.generateNewId = function () {
        this.id = Date.now();
    };
    Schedule.prototype.getID = function () {
        return this.id;
    };
    Schedule.prototype.getNextEvent = function () {
        var _a;
        var now = Date.now();
        var eventDates = [
            this.pauseUntil,
            this.unlockedUntil,
            this.getNextAlarm(),
        ].filter(function (e) { return e && e.getTime() > now; });
        eventDates.sort(function (a, b) { return (a.getTime() - now) - (b.getTime() - now); });
        return (_a = eventDates[0]) !== null && _a !== void 0 ? _a : null;
    };
    Schedule.prototype.getNextAlarm = function () {
        var _this = this;
        var _a;
        var now = new Date();
        var nextAlarms = [];
        var _days = new Set(this.days);
        switch (this.executionMode) {
            case ScheduleTimeExecutionMode.daily:
                (_a = this.days) === null || _a === void 0 ? void 0 : _a.forEach(function (day) {
                    var dayTime = new DayTime();
                    dayTime.hour = 23;
                    dayTime.minutes = 59;
                    var nextAlarm = DateUtils.nextDayAndTime(day, dayTime, new Date());
                    nextAlarm.setHours(0, 0, 0, 0);
                    var start = new Date(nextAlarm);
                    if (start > now) {
                        nextAlarms.push(start);
                    }
                    nextAlarm.setDate(nextAlarm.getDate() + 1);
                    nextAlarms.push(nextAlarm);
                });
                break;
            case ScheduleTimeExecutionMode.intervals:
                var _loop_1 = function (index) {
                    var date = new Date();
                    date.setDate(date.getDate() + index);
                    date.setHours(0, 0, 0, 0);
                    this_1.timeRanges.forEach(function (timeRange) {
                        var activeDates = TimeUtils.getTimeRangeStartEnd(date, timeRange);
                        var day = DaysUtils.fromJsIndex(date.getDay());
                        if (_this.days.has(day)) {
                            if (activeDates) {
                                var dayAfter = DaysUtils.fromJsIndex((date.getDay() + 1));
                                var isNextDay = TimeRange.isNextDay(timeRange);
                                if (_this.days.has(day) || (isNextDay && _this.days.has(dayAfter))) {
                                    if (now < activeDates.start) {
                                        nextAlarms.push(activeDates.start);
                                    }
                                    if (now < activeDates.end) {
                                        nextAlarms.push(activeDates.end);
                                    }
                                }
                            }
                        }
                    });
                };
                var this_1 = this;
                //Index start from yesterday
                for (var index = -1; index < 7; index++) {
                    _loop_1(index);
                }
                break;
        }
        ;
        nextAlarms = nextAlarms.sort(function (a, b) { return a.getTime() - b.getTime(); });
        var closestAlarm = new Date();
        var hasAlarm = false;
        for (var _i = 0, nextAlarms_1 = nextAlarms; _i < nextAlarms_1.length; _i++) {
            var alarm = nextAlarms_1[_i];
            if (alarm.getTime() > (closestAlarm ? closestAlarm.getTime() : 0)) {
                hasAlarm = true;
                closestAlarm = alarm;
                break;
            }
        }
        return hasAlarm ? closestAlarm : null;
    };
    Schedule.preset = function () {
        var today = new Date();
        var schedule = new Schedule();
        schedule.name = Lang.tr("new_schedule");
        schedule.timeRanges[0] = DateUtils.clampedTimeRange();
        schedule.executionMode = ScheduleTimeExecutionMode.intervals;
        schedule.days.add(DaysUtils.fromJsIndex(today.getDay()));
        return schedule;
    };
    Schedule.fromTemplate = function (template) {
        var schedule = new Schedule();
        schedule.name = template.name;
        schedule.icon = template.icon;
        schedule.timeRanges = template.timeRanges;
        schedule.executionMode = template.executionMode;
        schedule.days = template.days;
        return schedule;
    };
    Schedule.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new Schedule());
        }
        else {
            newInstance = Serializer.deserialize(Serializer.serialize(another), new Schedule());
        }
        if (newInstance.pauseUntil) {
            newInstance.pauseUntil = new Date(newInstance.pauseUntil);
        }
        if (newInstance.pauseStart) {
            newInstance.pauseStart = new Date(newInstance.pauseStart);
        }
        if (newInstance.unlockedUntil) {
            newInstance.unlockedUntil = new Date(newInstance.unlockedUntil);
        }
        return newInstance;
    };
    return Schedule;
}(ExpressionBlocker));
export { Schedule };
