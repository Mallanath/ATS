var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import ChromeCoreProtocol, { SubscriptionChannelIdentifier } from "./chrome_core_communicator.js";
import { QuickBlock } from "./quick-block/quick_block.js";
import AppblockCoreIntefrace from "./access_protocol.js";
import { ScheduleManager } from "./schedules/schedule_manager.js";
import { Serializer } from "./utils/serializer.js";
import { BlockMode, UrlBlockMode } from "./common/blocking_expressions.js";
import { AppBlockVersionMigrator } from "./migrations/migrator.js";
import { SharedPreferences } from "./settings/settings.js";
import { StrictMode, StrictModeType } from "./strict_mode/strict_mode.js";
import { UserManager } from "./user_profile/user_manager.js";
var AlarmType;
(function (AlarmType) {
    AlarmType[AlarmType["Schedule"] = 0] = "Schedule";
    AlarmType[AlarmType["QuickBlockTimer"] = 1] = "QuickBlockTimer";
    AlarmType[AlarmType["StrictMode"] = 2] = "StrictMode";
})(AlarmType || (AlarmType = {}));
var CoreUtils = /** @class */ (function () {
    function CoreUtils() {
    }
    Object.defineProperty(CoreUtils, "quickBlockTimerAlarmName", {
        get: function () {
            return "QuickBlock-Timer";
        },
        enumerable: false,
        configurable: true
    });
    CoreUtils.scheduleAlarmName = function (schedule) {
        return "Schedule-Alarm(" + schedule.getID() + ")";
    };
    Object.defineProperty(CoreUtils, "strictModeAlarmName", {
        get: function () {
            return "StrictMode-Alarm";
        },
        enumerable: false,
        configurable: true
    });
    CoreUtils.checkAlarmType = function (alarmName) {
        if (alarmName.startsWith("Schedule-Alarm"))
            return AlarmType.Schedule;
        if (alarmName.startsWith(CoreUtils.quickBlockTimerAlarmName))
            return AlarmType.QuickBlockTimer;
        if (alarmName.startsWith(CoreUtils.strictModeAlarmName))
            return AlarmType.StrictMode;
        return null;
    };
    return CoreUtils;
}());
export { CoreUtils };
var ChromeCore = /** @class */ (function () {
    function ChromeCore() {
        var _this = this;
        //Members
        this.quickBlock = new QuickBlock();
        // private quickBlockTimer: NodeJS.Timer | null = null;
        this.strictMode = new StrictMode();
        this.userManager = new UserManager();
        this.scheduleManager = new ScheduleManager();
        this.sharedPreferences = new SharedPreferences();
        this.actualUrl = undefined;
        this.onActualTabChanged = function () { return __awaiter(_this, void 0, void 0, function () {
            var queryOptions, tabs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryOptions = { active: true, currentWindow: true };
                        return [4 /*yield*/, chrome.tabs.query(queryOptions)];
                    case 1:
                        tabs = _b.sent();
                        if (tabs[0]) {
                            this.actualUrl = tabs[0].url;
                        }
                        this.notifyCurrentUrlChange();
                        return [2 /*return*/];
                }
            });
        }); };
        this.notifyCurrentUrlChange = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.CurrentUrl, {
                    'method': AppblockCoreIntefrace.ContentScriptAPI.CurrentUrlUpdate.identifier,
                    //Must be serialized by custom serializer, because by default JSON Stringify does not support Map DataType
                    'data': { actualUrl: this.actualUrl },
                });
                return [2 /*return*/];
            });
        }); };
        this.notifyStrictModeChanges = function (notifyWebTabs) {
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.StrictMode, {
                                'method': AppblockCoreIntefrace.StrictMode.SubscribeChanges.SyncUpdate.identifier,
                                //Must be serialized by custom serializer, because by default JSON Stringify does not support Map DataType
                                'data': Serializer.serialize(this.strictMode),
                            }, notifyWebTabs);
                            return [4 /*yield*/, chrome.alarms.clear(CoreUtils.strictModeAlarmName)];
                        case 1:
                            _b.sent();
                            if (this.strictMode.currentType == StrictModeType.timer && this.strictMode.isActive) {
                                chrome.alarms.create(CoreUtils.strictModeAlarmName, {
                                    when: this.strictMode.timerEndTime,
                                });
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.notifySchedulesChanges = function (notifyWebTabs) {
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            return __awaiter(_this, void 0, void 0, function () {
                var alarms, _i, alarms_1, alarm;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.ScheduleManager, {
                                'method': AppblockCoreIntefrace.Schedules.SubscribeChanges.SyncUpdate.identifier,
                                //Must be serialized by custom serializer, because by default JSON Stringify does not support Map DataType
                                'data': Serializer.serialize(this.scheduleManager),
                            }, notifyWebTabs);
                            return [4 /*yield*/, chrome.alarms.getAll()];
                        case 1:
                            alarms = _d.sent();
                            _i = 0, alarms_1 = alarms;
                            _d.label = 2;
                        case 2:
                            if (!(_i < alarms_1.length)) return [3 /*break*/, 5];
                            alarm = alarms_1[_i];
                            if (!(CoreUtils.checkAlarmType(alarm.name) == AlarmType.Schedule)) return [3 /*break*/, 4];
                            return [4 /*yield*/, chrome.alarms.clear(alarm.name)];
                        case 3:
                            _d.sent();
                            _d.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            ///Set new schedule Alarms
                            (_c = (_b = this.scheduleManager) === null || _b === void 0 ? void 0 : _b.schedules) === null || _c === void 0 ? void 0 : _c.forEach(function (schedule) {
                                var nextAlarm = schedule.getNextEvent();
                                if (nextAlarm && nextAlarm.getTime() >= Date.now()) {
                                    chrome.alarms.create(CoreUtils.scheduleAlarmName(schedule), {
                                        when: nextAlarm.getTime() + 100
                                    });
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.notifyUserManagerChanges = function (notifyWebTabs) {
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.UserManager, {
                        'method': AppblockCoreIntefrace.UserManager.SubscribeChanges.SyncUpdate.identifier,
                        'data': this.userManager,
                    }, notifyWebTabs);
                    return [2 /*return*/];
                });
            });
        };
        this.notifySharedPreferencesChanges = function (notifyWebTabs) {
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.SharedPreferences, {
                        'method': AppblockCoreIntefrace.SharedPreferences.SubscribeChanges.SyncUpdate.identifier,
                        'data': this.sharedPreferences,
                    }, notifyWebTabs);
                    return [2 /*return*/];
                });
            });
        };
        this.notifyQuickBlockChanges = function (ommitTimeout, notifyWebTabs) {
            if (ommitTimeout === void 0) { ommitTimeout = false; }
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            ChromeCore.protocol.notifySubscribers(SubscriptionChannelIdentifier.QuickBlock, {
                                'method': AppblockCoreIntefrace.QuickBlock.SubscribeChanges.SyncUpdate.identifier,
                                'data': this.quickBlock,
                            }, notifyWebTabs);
                            return [4 /*yield*/, chrome.alarms.clear(CoreUtils.quickBlockTimerAlarmName)];
                        case 1:
                            _b.sent();
                            if (this.quickBlock.endTimestamp && this.quickBlock.endTimestamp >= Date.now()) {
                                chrome.alarms.create(CoreUtils.quickBlockTimerAlarmName, {
                                    when: this.quickBlock.endTimestamp,
                                });
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.start = function (notifyWebTabs) {
            if (notifyWebTabs === void 0) { notifyWebTabs = true; }
            // Load Data from Storage
            chrome.storage.local.get([
                QuickBlock.name,
                ScheduleManager.name,
                SharedPreferences.name,
                StrictMode.name,
                UserManager.name,
            ], function (result) {
                if (result[QuickBlock.name]) {
                    if (result[QuickBlock.name]) {
                        _this.quickBlock = QuickBlock.from(result[QuickBlock.name]);
                    }
                    _this.notifyQuickBlockChanges(notifyWebTabs);
                }
                if (result[ScheduleManager.name]) {
                    if (result[ScheduleManager.name]) {
                        _this.scheduleManager = ScheduleManager.from(result[ScheduleManager.name]);
                    }
                    _this.notifySchedulesChanges(notifyWebTabs);
                }
                if (result[StrictMode.name]) {
                    if (result[StrictMode.name]) {
                        _this.strictMode = StrictMode.from(result[StrictMode.name]);
                    }
                    _this.notifyStrictModeChanges(notifyWebTabs);
                }
                if (result[UserManager.name]) {
                    if (result[UserManager.name]) {
                        _this.userManager = UserManager.from(result[UserManager.name]);
                        console.log("LOADING USER MANAGER", _this.userManager, result[UserManager.name]);
                    }
                    _this.notifyUserManagerChanges();
                }
                if (result[SharedPreferences.name]) {
                    if (result[SharedPreferences.name]) {
                        _this.sharedPreferences = SharedPreferences.from(result[SharedPreferences.name]);
                    }
                    _this.notifySharedPreferencesChanges();
                }
                _this.updateExtensionIcon();
                _this.updateBlockedWebsites();
            });
        };
        this.onStorageChanged = function (changes, namespace) {
            if (namespace === 'local') {
                if (changes[QuickBlock.name]) {
                    _this.quickBlock = QuickBlock.from(changes[QuickBlock.name].newValue);
                    _this.notifyQuickBlockChanges();
                }
                if (changes[ScheduleManager.name]) {
                    _this.scheduleManager = ScheduleManager.from(changes[ScheduleManager.name].newValue);
                    _this.notifySchedulesChanges();
                }
                if (changes[UserManager.name]) {
                    _this.userManager = UserManager.from(changes[UserManager.name].newValue);
                    _this.notifyUserManagerChanges();
                }
                if (changes[StrictMode.name]) {
                    _this.strictMode = StrictMode.from(changes[StrictMode.name].newValue);
                    _this.notifyStrictModeChanges();
                }
                if (changes[SharedPreferences.name]) {
                    _this.sharedPreferences = SharedPreferences.from(changes[SharedPreferences.name].newValue);
                    _this.notifySharedPreferencesChanges();
                }
                _this.updateExtensionIcon();
                _this.updateBlockedWebsites();
            }
        };
        this.onAlarm = function (alarm) {
            switch (CoreUtils.checkAlarmType(alarm.name)) {
                case AlarmType.Schedule:
                    _this.notifySchedulesChanges();
                    break;
                case AlarmType.QuickBlockTimer:
                    _this.notifyQuickBlockChanges();
                    break;
                case AlarmType.StrictMode:
                    _this.notifyStrictModeChanges();
                    break;
            }
            _this.updateExtensionIcon();
            _this.updateBlockedWebsites();
        };
        //Hooks
        this.onExtensionInstalled = function (details) { return __awaiter(_this, void 0, void 0, function () {
            var thisVersion;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(details.reason == "install")) return [3 /*break*/, 1];
                        //console.log("AppBlock extension installed");
                        chrome.storage.local.remove([
                            QuickBlock.name,
                            ScheduleManager.name,
                            SharedPreferences.name,
                            StrictMode.name,
                            UserManager.name,
                        ], function () {
                            //console.log("Appblock clear storage on safari");
                            _this.start();
                        });
                        return [3 /*break*/, 3];
                    case 1:
                        if (!(details.reason == "update")) return [3 /*break*/, 3];
                        thisVersion = chrome.runtime.getManifest().version;
                        //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
                        return [4 /*yield*/, AppBlockVersionMigrator.migrate_V1_1_0_to_V1_1_1()];
                    case 2:
                        //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
                        _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateBlockedWebsites = function () {
            var newRules;
            var filters = new Map([]);
            if (_this.quickBlock.isActive) {
                for (var _i = 0, _b = [_this.quickBlock]; _i < _b.length; _i++) {
                    var blocker = _b[_i];
                    if (blocker.blockMode === BlockMode.allowlist) {
                        continue;
                    }
                    for (var _c = 0, _d = blocker.blockWebExpressions; _c < _d.length; _c++) {
                        var expression = _d[_c];
                        if (expression.isActive) {
                            filters.set("||".concat(expression.expression.toLowerCase()), "quick_block");
                        }
                    }
                }
            }
            _this.scheduleManager.schedules.forEach(function (schedule) {
                if (schedule.isActive) {
                    for (var _i = 0, _b = schedule.blockWebExpressions; _i < _b.length; _i++) {
                        var expression = _b[_i];
                        if (expression.isActive) {
                            filters.set("||".concat(expression.expression.toLowerCase()), schedule.name);
                        }
                    }
                }
            });
            var EXT_PAGE = chrome.runtime.getURL('/block.html');
            newRules = Array.from(filters).map(function (expStr, i) {
                var url = expStr[0];
                if (!url.startsWith("||localhost")) {
                    url = expStr[0].replace("||", "https://www.");
                }
                else {
                    url = expStr[0].replace("||", "http://");
                }
                var domain = expStr[0].replace("||", "");
                return {
                    id: i + 1,
                    action: { type: 'redirect', redirect: { regexSubstitution: EXT_PAGE + '?url=\\0' + '&name=' + encodeURI(expStr[1]) } },
                    condition: {
                        requestDomains: [domain],
                        regexFilter: '^.+$',
                        resourceTypes: ['main_frame', 'sub_frame'],
                    },
                };
            });
            chrome.declarativeNetRequest.getDynamicRules(function (previousRules) {
                var previousRuleIds = previousRules.map(function (rule) { return rule.id; });
                chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: previousRuleIds, addRules: newRules });
            });
        };
        if (ChromeCore.instance) {
            throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
        }
        ChromeCore.instance = this;
    }
    ChromeCore.getInstance = function () {
        return ChromeCore.instance;
    };
    ChromeCore.prototype.sendToAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tabs;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, chrome.tabs.query({})];
                    case 1:
                        tabs = _b.sent();
                        tabs.forEach(function (tab) { return __awaiter(_this, void 0, void 0, function () {
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!tab.id) return [3 /*break*/, 4];
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, chrome.tabs.sendMessage(tab.id, { "message": Date.now() })];
                                    case 2:
                                        _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _b = _c.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    ChromeCore.prototype.init = function () {
        var _this = this;
        chrome.runtime.onInstalled.addListener(this.onExtensionInstalled);
        chrome.runtime.onStartup.addListener(function () { return _this.start(); });
        chrome.webNavigation.onBeforeNavigate.addListener(this.onBeforeNavigate, { url: [{ hostContains: "domain" }] });
        chrome.runtime.onMessage.addListener(ChromeCore.protocol.onMessage);
        chrome.storage.onChanged.addListener(this.onStorageChanged);
        chrome.alarms.onAlarm.addListener(this.onAlarm);
        chrome.tabs.onUpdated.addListener(this.onActualTabChanged);
        chrome.tabs.onActivated.addListener(this.onActualTabChanged);
        chrome.action.onClicked.addListener(this.onActualTabChanged);
        chrome.tabs.onActivated.addListener(function (activeInfo) { _this.start(false); });
        // chrome.tabs.onUpdated.addListener((tabId, change, tab) => { console.log("TAB ON UPDATED"); this.start(); });
        chrome.windows.onFocusChanged.addListener(function (windowID) { _this.start(false); });
        chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSe_1vrs5fZdbP_LAs5XvVz1k0PYKk44i6vzQ3I-ngyXd9QYwQ/viewform?usp=sharing");
        this.start();
    };
    ChromeCore.prototype.updateExtensionIcon = function () {
        var isActive = this.quickBlock.isActive ||
            Array.from(this.scheduleManager.schedules.values()).some(function (e) { return e.isActive; });
        chrome.action.setIcon({ path: isActive ? "/images/icon128x128-active.png" : "/images/icon128x128.png" });
    };
    ChromeCore.prototype.getCurrentTab = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tabs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, chrome.tabs.query({ active: true, currentWindow: true })];
                    case 1:
                        tabs = _b.sent();
                        return [2 /*return*/, tabs[0]];
                }
            });
        });
    };
    ChromeCore.prototype.onBeforeNavigate = function () {
        // chrome.webRequest.onResponseStarted.addListener((details) => {
        //     this.start();
        // }, { urls: ["*://domain/*"], types: ["main_frame"] });
    };
    ChromeCore.prototype.onExtensionIconClicked = function (tab) {
        //this.actualUrl = tab.url ?? "";
    };
    ChromeCore.shouldBlock = function (data, href, hostname, content) {
        //console.log("CHROME CORE SHOULD BLOCK FUNCTION");
        var windowHostname = hostname;
        var shouldBlockWebsite = false;
        if (windowHostname.startsWith("www.")) {
            windowHostname = windowHostname.replace(/www\./g, '');
        }
        shouldBlockWebsite = data.blockWebExpressions.some(function (e) {
            //console.log("CHECKING EXPRESSION ", e.expression);
            var loc = null;
            if (e.isActive && e.blockMode === BlockMode.blocklist) {
                if (e.expression.startsWith("localhost")) {
                    loc = new URL("https://".concat(e.expression));
                    var locHref = new URL(href);
                    if (loc.port) {
                        //console.log("COMPARING WL", locHref.host, " : ", loc.host);
                        return locHref.host == loc.host;
                    }
                    else {
                        //console.log("COMPARING WL", locHref.hostname, " : ", loc.hostname);
                        return locHref.hostname == loc.hostname;
                    }
                }
                else {
                    try {
                        loc = new URL(e.expression);
                    }
                    catch (exception) {
                        loc = new URL("https://".concat(e.expression));
                    }
                    //console.log("COMPARING WL", windowHostname, " : ", loc.hostname);
                    return windowHostname == loc.hostname;
                }
            }
        });
        if (!shouldBlockWebsite) {
            shouldBlockWebsite = data.blockKeywordsExpressions.some(function (e) {
                if (e.isActive && e.blockMode === BlockMode.blocklist) {
                    var containsInUrl = false;
                    var containsInContent = false;
                    switch (e.urlBlockMode) {
                        case UrlBlockMode.domain:
                            containsInUrl = windowHostname.toLowerCase().includes(e.expression.toLowerCase());
                            break;
                        case UrlBlockMode.url:
                            containsInUrl = href.toLowerCase().includes(e.expression.toLowerCase());
                            break;
                    }
                    //Optimized for better performance // no need to check content
                    if (content != null && !containsInUrl && e.blockContent) {
                        containsInContent = content.toLowerCase().includes(e.expression.toLowerCase());
                    }
                    return (containsInUrl || containsInContent);
                }
                return false;
            });
        }
        return shouldBlockWebsite;
    };
    ChromeCore.shouldAllow = function (data, href, hostname, content) {
        //console.log("CHROME CORE SHOULD BLOCK FUNCTION");
        var windowHostname = hostname;
        var shouldAllowWebsite = false;
        if (windowHostname.startsWith("www.")) {
            windowHostname = windowHostname.replace(/www\./g, '');
        }
        var shouldAllowWebsiteCount = data.blockWebExpressions.filter(function (e) { return e.blockMode === BlockMode.allowlist && e.isActive; });
        if (shouldAllowWebsiteCount.length === 0) {
            return true;
        }
        shouldAllowWebsite = data.blockWebExpressions.some(function (e) {
            //console.log("CHECKING EXPRESSION ", e.expression);
            var loc = null;
            if (e.isActive && e.blockMode === BlockMode.allowlist) {
                if (e.expression.startsWith("localhost")) {
                    loc = new URL("https://".concat(e.expression));
                    var locHref = new URL(href);
                    if (loc.port) {
                        //console.log("COMPARING WL", locHref.host, " : ", loc.host);
                        return locHref.host == loc.host;
                    }
                    else {
                        //console.log("COMPARING WL", locHref.hostname, " : ", loc.hostname);
                        return locHref.hostname == loc.hostname;
                    }
                }
                else {
                    try {
                        loc = new URL(e.expression);
                    }
                    catch (exception) {
                        loc = new URL("https://".concat(e.expression));
                    }
                    //console.log("COMPARING WL", windowHostname, " : ", loc.hostname);
                    return windowHostname == loc.hostname;
                }
            }
        });
        return shouldAllowWebsite;
    };
    ChromeCore.getBlockName = function (data, href, hostname, content) {
        //console.log("CHROME CORE SHOULD BLOCK FUNCTION");
        var windowHostname = hostname;
        var shouldBlockWebsite = false;
        var blocklistName = "";
        if (windowHostname.startsWith("www.")) {
            windowHostname = windowHostname.replace(/www\./g, '');
        }
        var shouldBlock = false;
        data.blockWebExpressions.forEach(function (e) {
            var _b, _c, _d;
            var loc = null;
            if (e.isActive && e.blockMode === BlockMode.blocklist) {
                if (e.expression.startsWith("localhost")) {
                    loc = new URL("https://".concat(e.expression));
                    var locHref = new URL(href);
                    if (loc.port) {
                        //console.log("COMPARING WL", locHref.host, " : ", loc.host);
                        //return locHref.host == loc.host;
                        if (locHref.host == loc.host) {
                            shouldBlock = true;
                            blocklistName = (_b = e.blocklistName) !== null && _b !== void 0 ? _b : "";
                            return;
                        }
                    }
                    else {
                        //console.log("COMPARING WL", locHref.hostname, " : ", loc.hostname);
                        //return locHref.hostname == loc.hostname;
                        if (locHref.hostname == loc.hostname) {
                            shouldBlock = true;
                            blocklistName = (_c = e.blocklistName) !== null && _c !== void 0 ? _c : "";
                            return;
                        }
                    }
                }
                else {
                    try {
                        loc = new URL(e.expression);
                    }
                    catch (exception) {
                        loc = new URL("https://".concat(e.expression));
                    }
                    //console.log("COMPARING WL", windowHostname, " : ", loc.hostname);
                    if (windowHostname == loc.hostname) {
                        shouldBlock = true;
                        blocklistName = (_d = e.blocklistName) !== null && _d !== void 0 ? _d : "";
                        return;
                    }
                }
            }
        });
        shouldBlockWebsite = shouldBlock;
        if (!shouldBlockWebsite) {
            shouldBlock = false;
            data.blockKeywordsExpressions.forEach(function (e) {
                var _b;
                if (e.isActive && e.blockMode === BlockMode.blocklist) {
                    var containsInUrl = false;
                    var containsInContent = false;
                    switch (e.urlBlockMode) {
                        case UrlBlockMode.domain:
                            containsInUrl = windowHostname.includes(e.expression);
                            break;
                        case UrlBlockMode.url:
                            containsInUrl = href.includes(e.expression);
                            break;
                    }
                    //Optimized for better performance // no need to check content
                    if (content != null && !containsInUrl && e.blockContent) {
                        containsInContent = content.includes(e.expression);
                    }
                    //return (containsInUrl || containsInContent);
                    if ((containsInUrl || containsInContent)) {
                        shouldBlock = true;
                        blocklistName = (_b = e.blocklistName) !== null && _b !== void 0 ? _b : "";
                        return;
                    }
                }
            });
            shouldBlockWebsite = shouldBlock;
        }
        return blocklistName;
    };
    ChromeCore.getAllowName = function (data, href, hostname, content) {
        var windowHostname = hostname;
        var shouldAllowWebsite = true;
        var blocklistName = "";
        if (windowHostname.startsWith("www.")) {
            windowHostname = windowHostname.replace(/www\./g, '');
        }
        var shouldAllowWebsiteCount = data.blockWebExpressions.filter(function (e) { return e.blockMode === BlockMode.allowlist && e.isActive; });
        if (shouldAllowWebsiteCount.length === 0) {
            return blocklistName;
        }
        data.blockWebExpressions.forEach(function (e) {
            var _b, _c, _d;
            var loc = null;
            if (e.isActive && e.blockMode === BlockMode.allowlist) {
                if (e.expression.startsWith("localhost")) {
                    loc = new URL("https://".concat(e.expression));
                    var locHref = new URL(href);
                    if (loc.port) {
                        //console.log("COMPARING WL", locHref.host, " : ", loc.host);
                        //return locHref.host == loc.host;
                        if ((locHref.host != loc.host)) {
                            shouldAllowWebsite = false;
                            blocklistName = (_b = e.blocklistName) !== null && _b !== void 0 ? _b : "";
                            return;
                        }
                    }
                    else {
                        //console.log("COMPARING WL", locHref.hostname, " : ", loc.hostname);
                        ///return locHref.hostname == loc.hostname;
                        if ((locHref.hostname != loc.hostname)) {
                            shouldAllowWebsite = false;
                            blocklistName = (_c = e.blocklistName) !== null && _c !== void 0 ? _c : "";
                            return;
                        }
                    }
                }
                else {
                    try {
                        loc = new URL(e.expression);
                    }
                    catch (exception) {
                        loc = new URL("https://".concat(e.expression));
                    }
                    //console.log("COMPARING WL", windowHostname, " : ", loc.hostname);
                    ///return windowHostname == loc.hostname;
                    if ((windowHostname != loc.hostname)) {
                        shouldAllowWebsite = false;
                        blocklistName = (_d = e.blocklistName) !== null && _d !== void 0 ? _d : "";
                        return;
                    }
                }
            }
        });
        return blocklistName;
    };
    var _a;
    _a = ChromeCore;
    ///Modules
    ChromeCore.instance = new ChromeCore();
    ChromeCore.protocol = new ChromeCoreProtocol(_a.instance);
    return ChromeCore;
}());
export default ChromeCore;
