import { DayTime, Days, TimeRange } from "./time.js";
import { ScheduleIconType, ScheduleTimeExecutionMode } from "./schedule.js";
import { Lang } from "../utils/translate.js";
var Template = /** @class */ (function () {
    function Template() {
        this.name = "";
        this.timeRanges = [new TimeRange()];
        this.days = new Set([]);
        this.executionMode = ScheduleTimeExecutionMode.daily;
        this.icon = "";
        this.helperText = "";
    }
    return Template;
}());
export { Template };
var ScheduleTemplates = /** @class */ (function () {
    function ScheduleTemplates() {
    }
    ScheduleTemplates.getIconsForEmptyView = function () {
        var icons = [];
        icons.push(ScheduleIconType.Hearth);
        icons.push(ScheduleIconType.Home);
        icons.push(ScheduleIconType.School);
        icons.push(ScheduleIconType.Clock);
        icons.push(ScheduleIconType.Books);
        icons.push(ScheduleIconType.Location);
        icons.push(ScheduleIconType.Laptop);
        icons.push(ScheduleIconType.Sleep);
        icons.push(ScheduleIconType.ShushingFace);
        icons.push(ScheduleIconType.Calendat);
        return icons;
    };
    ScheduleTemplates.getTemplates = function () {
        var templates = [];
        templates.push(this.createTemplate(Lang.tr("schedule_template_focus"), ScheduleIconType.Goal, Lang.tr("schedule_template_focus_text"), new Set([Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday]), 8, 17));
        templates.push(this.createTemplate(Lang.tr("schedule_template_myself"), ScheduleIconType.Bicycle, Lang.tr("schedule_template_myself_text"), new Set([Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday]), 17, 18));
        templates.push(this.createTemplate(Lang.tr("schedule_template_detox"), ScheduleIconType.Stones, Lang.tr("schedule_template_detox_text"), new Set([Days.Sunday]), 0, 23, 0, 59, ScheduleTimeExecutionMode.daily));
        templates.push(this.createTemplate(Lang.tr("schedule_template_winddown"), ScheduleIconType.Night, Lang.tr("schedule_template_winddown_text"), new Set([Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday, Days.Saturday, Days.Sunday]), 20, 23, null, 59));
        templates.push(this.createTemplate(Lang.tr("schedule_template_morning"), ScheduleIconType.Leaf, Lang.tr("schedule_template_morning_text"), new Set([Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday]), 8, 9));
        templates.push(this.createTemplate(Lang.tr("schedule_template_study"), ScheduleIconType.Books, Lang.tr("schedule_template_study_text"), new Set([Days.Monday, Days.Tuesday, Days.Wednesday, Days.Thursday, Days.Friday]), 18, 21));
        return templates;
    };
    ScheduleTemplates.createTemplate = function (name, icon, helperText, days, startHour, endHour, startMinute, endMinute, executionMode) {
        if (startMinute === void 0) { startMinute = null; }
        if (endMinute === void 0) { endMinute = null; }
        if (executionMode === void 0) { executionMode = ScheduleTimeExecutionMode.intervals; }
        var template = new Template();
        template.name = name;
        template.icon = icon;
        template.helperText = helperText;
        template.days = days;
        template.executionMode = executionMode;
        template.timeRanges = [];
        if (executionMode == ScheduleTimeExecutionMode.intervals && startHour && endHour) {
            var startTime = new DayTime();
            startTime.hour = startHour;
            startTime.minutes = startMinute !== null && startMinute !== void 0 ? startMinute : 0;
            var endTime = new DayTime();
            endTime.hour = endHour;
            endTime.minutes = endMinute !== null && endMinute !== void 0 ? endMinute : 0;
            var tr = new TimeRange();
            tr.start = startTime;
            tr.end = endTime;
            template.timeRanges = [tr];
        }
        return template;
    };
    return ScheduleTemplates;
}());
export { ScheduleTemplates };
