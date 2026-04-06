import { Serializer } from "../utils/serializer.js";
import { Schedule } from "./schedule.js";
var ScheduleManager = /** @class */ (function () {
    function ScheduleManager() {
        //Map<number, sc
        this.schedules = new Map([]);
    }
    Object.defineProperty(ScheduleManager.prototype, "sortedSchedules", {
        get: function () {
            return Array.from(this.schedules.values()).sort(function (a, b) {
                return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || a.getID() - b.getID();
            });
        },
        enumerable: false,
        configurable: true
    });
    ScheduleManager.from = function (another) {
        var newManager;
        if (typeof another === 'string') {
            newManager = Serializer.deserialize(another, new ScheduleManager());
        }
        else {
            newManager = Serializer.clone(another, new ScheduleManager());
        }
        var newSchedules = new Map([]);
        newManager.schedules.forEach(function (e) {
            if ("id" in e) {
                var id = e.id;
                newSchedules.set(id, Schedule.from(e));
            }
        });
        newManager.schedules = newSchedules;
        return newManager;
    };
    return ScheduleManager;
}());
export { ScheduleManager };
