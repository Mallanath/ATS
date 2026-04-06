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
import { ExpressionBlocker } from '../common/blocking_expressions.js';
import { Serializer } from '../utils/serializer.js';
var QuickBlock = /** @class */ (function (_super) {
    __extends(QuickBlock, _super);
    function QuickBlock() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.startTimestamp = null;
        _this.timerDurationSeconds = null;
        return _this;
        // get isFirstLoad(): boolean {
        //     return this.firstLoad;
        // }
    }
    QuickBlock.from = function (another) {
        if (typeof another === 'string') {
            return Serializer.deserialize(another, new QuickBlock());
        }
        return Serializer.deserialize(Serializer.serialize(another), new QuickBlock());
    };
    Object.defineProperty(QuickBlock.prototype, "isTimerActive", {
        get: function () {
            return this.timerDurationSeconds != null && this.timerDurationSeconds != undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(QuickBlock.prototype, "isActive", {
        get: function () {
            var _a;
            var started = this.startTimestamp != undefined && this.startTimestamp != null;
            var isTimerValid = started && (this.startTimestamp + ((_a = this.timerDurationSeconds) !== null && _a !== void 0 ? _a : Date.now()) * 1000) > Date.now();
            var state = started && isTimerValid;
            return state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(QuickBlock.prototype, "endTimestamp", {
        get: function () {
            var _a;
            return this.isTimerActive ? this.timerDurationSeconds * 1000 + ((_a = this.startTimestamp) !== null && _a !== void 0 ? _a : 0) : null;
        },
        enumerable: false,
        configurable: true
    });
    return QuickBlock;
}(ExpressionBlocker));
export { QuickBlock, };
