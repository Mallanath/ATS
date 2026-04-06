import { Days } from "../schedules/time.js";
import { Lang } from "../utils/translate.js";
var TextFormatter = /** @class */ (function () {
    function TextFormatter() {
    }
    TextFormatter.daysEnumFormatter = function (days) {
        if (days.size == 0) {
            return Lang.tr("select_days");
        }
        if (days.size == 7) {
            return Lang.tr("every_day");
        }
        if (days.size == 2 && [Days.Saturday, Days.Sunday].every(function (e) { return days.has(e); })) {
            return Lang.tr("weekend");
        }
        if (days.size == 5 && [Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday].every(function (e) { return days.has(e); })) {
            return Lang.tr("weekdays");
        }
        if (days.size == 1) {
            if (Lang.getUiLang() === "cs") {
                return this.getCzechEvery(Array.from(days)[0]) + " " + Lang.tr(Array.from(days)[0].toLowerCase());
            }
            else {
                return Lang.tr("every") + " " + Lang.tr(Array.from(days)[0].toLowerCase());
            }
        }
        if (Lang.getUiLang() === "cs") {
            return this.getCzechEvery(Array.from(days).sort(function (a, b) { return Object.keys(Days).indexOf(a) - Object.keys(Days).indexOf(b); })[0]) + " " + Array.from(days).sort(function (a, b) { return Object.keys(Days).indexOf(a) - Object.keys(Days).indexOf(b); }).map(function (e) { return Lang.tr(e.toLowerCase() + "_short"); }).join(", ");
        }
        else {
            return Lang.tr("every") + " " + Array.from(days).sort(function (a, b) { return Object.keys(Days).indexOf(a) - Object.keys(Days).indexOf(b); }).map(function (e) { return Lang.tr(e.toLowerCase() + "_short"); }).join(", ");
        }
    };
    TextFormatter.getCzechEvery = function (day) {
        if ([Days.Monday, Days.Tuesday].includes(day)) {
            return Lang.tr("every_3");
        }
        if ([Days.Wednesday, Days.Saturday, Days.Sunday].includes(day)) {
            return Lang.tr("every_2");
        }
        return Lang.tr("every");
    };
    TextFormatter.padLeft = function (number, length, character) {
        if (character === void 0) { character = '0'; }
        var result = String(number);
        for (var i = result.length; i < length; ++i) {
            result = character + result;
        }
        return result;
    };
    TextFormatter.dayTimeFormatter = function (time) {
        return "".concat(this.padLeft(time.hour, 2), ":").concat(this.padLeft(time.minutes, 2));
    };
    TextFormatter.msToFormattedTime = function (ms) {
        var d, h, m, s;
        s = Math.floor(ms / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;
        return "".concat(d > 0 ? "".concat(d, ":").concat(this.padLeft(h, 2), ":") : "".concat(h, ":")).concat(this.padLeft(m, 2), ":").concat(this.padLeft(s, 2));
    };
    TextFormatter.timeRangeFormatter = function (ranges) {
        var _this = this;
        if (ranges.length == 0) {
            return Lang.tr("all_day_long");
        }
        if (ranges.length > 2) {
            return ranges.length + " intervals";
        }
        return ranges.map(function (e) { return "".concat(_this.padLeft(e.start.hour, 2), ":").concat(_this.padLeft(e.start.minutes, 2), " - ").concat(_this.padLeft(e.end.hour, 2), ":").concat(_this.padLeft(e.end.minutes, 2)); }).join(", ");
    };
    return TextFormatter;
}());
export { TextFormatter };
