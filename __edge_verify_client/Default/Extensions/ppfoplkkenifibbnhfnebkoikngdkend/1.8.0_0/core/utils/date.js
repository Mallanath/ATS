import { DaysUtils, TimeRange } from "../schedules/time.js";
var DateUtils = /** @class */ (function () {
    function DateUtils() {
    }
    DateUtils.getNextDayOfTheWeek = function (day, refDate, excludeToday) {
        if (refDate === void 0) { refDate = new Date(); }
        if (excludeToday === void 0) { excludeToday = true; }
        var dayIndex = DaysUtils.toJSDayIndex(day);
        if (dayIndex < 0)
            return;
        refDate.setHours(0, 0, 0, 0);
        refDate.setDate(refDate.getDate() + +!!excludeToday + (dayIndex + 7 - refDate.getDay() - +!!excludeToday) % 7);
        return refDate;
    };
    DateUtils.nextDayAndTime = function (day, time, refDate) {
        if (refDate === void 0) { refDate = new Date(); }
        var reference = refDate !== null && refDate !== void 0 ? refDate : new Date();
        var result = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + (7 + DaysUtils.toJSDayIndex(day) - reference.getDay()) % 7, time.hour, time.minutes);
        if (result < reference)
            result.setDate(result.getDate() + 7);
        return result;
    };
    DateUtils.clampedTimeRange = function (clampMinutes, start) {
        if (clampMinutes === void 0) { clampMinutes = 10; }
        if (start === void 0) { start = new Date(); }
        var timeRange = new TimeRange();
        var coeff = 1000 * 60 * 10; //clamp to closest 10 minutes;
        var date = new Date();
        var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
        var end = new Date(rounded.getTime() + 120 * 60000);
        timeRange.start.hour = rounded.getHours();
        timeRange.start.minutes = rounded.getMinutes();
        timeRange.end.hour = end.getHours();
        timeRange.end.minutes = end.getMinutes();
        return timeRange;
    };
    return DateUtils;
}());
export { DateUtils };
