import { Serializer } from '../utils/serializer.js';
var StrictModeForceActivationMode;
(function (StrictModeForceActivationMode) {
    StrictModeForceActivationMode[StrictModeForceActivationMode["forceActive"] = 0] = "forceActive";
    StrictModeForceActivationMode[StrictModeForceActivationMode["forceInactive"] = 1] = "forceInactive";
    StrictModeForceActivationMode[StrictModeForceActivationMode["noInfluence"] = 2] = "noInfluence";
})(StrictModeForceActivationMode || (StrictModeForceActivationMode = {}));
var TimeUnit;
(function (TimeUnit) {
    TimeUnit["minutes"] = "minutes";
    TimeUnit["hours"] = "hours";
    TimeUnit["days"] = "days";
})(TimeUnit || (TimeUnit = {}));
var StrictModeType;
(function (StrictModeType) {
    StrictModeType[StrictModeType["timer"] = 0] = "timer";
    StrictModeType[StrictModeType["pin"] = 1] = "pin";
    StrictModeType[StrictModeType["followSchedules"] = 2] = "followSchedules";
})(StrictModeType || (StrictModeType = {}));
var StrictMode = /** @class */ (function () {
    function StrictMode() {
        this.forceActivationMode = StrictModeForceActivationMode.noInfluence;
        this.currentType = StrictModeType.timer;
        this.timerEndTime = null;
        this.timerPresetValue = 5;
        this.timerPresetUnit = TimeUnit.hours;
        this.pin = null;
    }
    Object.defineProperty(StrictMode.prototype, "isActive", {
        get: function () {
            var _a;
            switch (this.forceActivationMode) {
                case StrictModeForceActivationMode.forceActive: return true;
                case StrictModeForceActivationMode.forceInactive: return false;
                case StrictModeForceActivationMode.noInfluence: break;
            }
            switch (this.currentType) {
                case StrictModeType.timer:
                    return this.timerEndTime != null && this.timerEndTime > 0 && (Date.now() < this.timerEndTime);
                case StrictModeType.pin:
                    return this.pin == null || ((_a = this.pin) === null || _a === void 0 ? void 0 : _a.length) == 0 ? false : true;
                case StrictModeType.followSchedules:
                    return false;
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    ;
    StrictMode.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new StrictMode());
        }
        else {
            newInstance = Serializer.deserialize(Serializer.serialize(another), new StrictMode());
        }
        return newInstance;
    };
    return StrictMode;
}());
export { StrictMode as StrictMode, StrictModeType as StrictModeType, StrictModeForceActivationMode as StrictModeForceActivationMode, TimeUnit as TimeUnit, };
