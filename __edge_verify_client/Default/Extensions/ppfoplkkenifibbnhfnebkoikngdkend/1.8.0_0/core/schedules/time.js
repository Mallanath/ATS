import { DateUtils } from "../utils/date.js";
export var Days;
(function (Days) {
    Days["Monday"] = "Monday";
    Days["Tuesday"] = "Tuesday";
    Days["Wednesday"] = "Wednesday";
    Days["Thursday"] = "Thursday";
    Days["Friday"] = "Friday";
    Days["Saturday"] = "Saturday";
    Days["Sunday"] = "Sunday";
})(Days || (Days = {}));
var TimeUtils = /** @class */ (function () {
    function TimeUtils() {
    }
    TimeUtils.isActive = function (dates) {
        return dates.start > dates.end;
    };
    TimeUtils.getTimeRangeStartEnd = function (referenceDate, timeRange) {
        var isRangeNextDay = TimeRange.isNextDay(timeRange);
        var yesterday = new Date(referenceDate);
        yesterday.setDate(referenceDate.getDate() - 1);
        var tomorrow = new Date();
        tomorrow.setDate(referenceDate.getDate() + 1);
        var start = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(referenceDate.getDay()), timeRange.start, referenceDate);
        var end;
        if (isRangeNextDay) {
            end = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(tomorrow.getDay()), timeRange.end, referenceDate);
        }
        else {
            end = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(referenceDate.getDay()), timeRange.end, referenceDate);
        }
        return { start: start, end: end };
    };
    TimeUtils.getActiveDates = function (referenceDate, timeRange, activeDays) {
        var isRangeNextDay = TimeRange.isNextDay(timeRange);
        var isActiveDay = activeDays.has(DaysUtils.fromJsIndex(referenceDate.getDay()));
        var yesterday = new Date(referenceDate);
        yesterday.setDate(referenceDate.getDate() - 1);
        var tomorrow = new Date();
        tomorrow.setDate(referenceDate.getDate() + 1);
        if (isActiveDay) {
            var start = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(referenceDate.getDay()), timeRange.start, referenceDate);
            var end = void 0;
            if (isRangeNextDay) {
                end = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(tomorrow.getDay()), timeRange.end, referenceDate);
            }
            else {
                end = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(referenceDate.getDay()), timeRange.end, referenceDate);
            }
            return { start: start, end: end };
        }
        else if (isRangeNextDay) {
            if (!activeDays.has(DaysUtils.fromJsIndex(yesterday.getDay()))) {
                return null;
            }
            var start = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(yesterday.getDay()), timeRange.start, referenceDate);
            var end = DateUtils.nextDayAndTime(DaysUtils.fromJsIndex(referenceDate.getDay()), timeRange.end, referenceDate);
            return { start: start, end: end }; // start > end;
        }
        return null;
    };
    return TimeUtils;
}());
export { TimeUtils };
var DaysUtils = /** @class */ (function () {
    function DaysUtils() {
    }
    DaysUtils.toJSDayIndex = function (day) {
        switch (day) {
            case Days.Sunday: return 0;
            case Days.Monday: return 1;
            case Days.Tuesday: return 2;
            case Days.Wednesday: return 3;
            case Days.Thursday: return 4;
            case Days.Friday: return 5;
            case Days.Saturday: return 6;
        }
    };
    DaysUtils.fromJsIndex = function (index) {
        return [
            Days.Sunday,
            Days.Monday,
            Days.Tuesday,
            Days.Wednesday,
            Days.Thursday,
            Days.Friday,
            Days.Saturday
        ][index % 7];
    };
    return DaysUtils;
}());
export { DaysUtils };
var DayTime = /** @class */ (function () {
    function DayTime() {
        this.hour = 0;
        this.minutes = 0;
    }
    return DayTime;
}());
export { DayTime };
var TimeRange = /** @class */ (function () {
    function TimeRange() {
        this.start = new DayTime();
        this.end = new DayTime();
    }
    TimeRange.allDay = function () {
        var range = new TimeRange();
        range.start = new DayTime();
        range.end = new DayTime();
        range.end.hour = 23;
        range.end.minutes = 59;
        return range;
    };
    TimeRange.isNextDay = function (range) {
        return (range.start.hour > range.end.hour) ||
            (range.start.hour === range.end.hour && range.end.minutes <= range.start.minutes);
    };
    return TimeRange;
}());
export { TimeRange };
