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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import Interface from "./access_protocol.js";
import { QuickBlock } from "./quick-block/quick_block.js";
import { Serializer } from "./utils/serializer.js";
import { Schedule, ScheduleManager, StrictMode } from "./model_types.js";
import * as Settings from "./settings/settings.js";
import { UserManager } from "./user_profile/user_manager.js";
// Subscription Channel definition - Example: Channel Quickblock, Schedule
var SubscriptionChannel = /** @class */ (function () {
    //TabId , Subscription config
    // tabSubs: Map<string, TabSubscriptionConfig> = new Map(); //tabId, subscription config
    function SubscriptionChannel(id) {
        this.id = id;
    }
    return SubscriptionChannel;
}());
export var SubscriptionChannelIdentifier;
(function (SubscriptionChannelIdentifier) {
    SubscriptionChannelIdentifier["QuickBlock"] = "QuickBlock";
    SubscriptionChannelIdentifier["SharedPreferences"] = "SharedPreferences";
    SubscriptionChannelIdentifier["ScheduleManager"] = "ScheduleManager";
    SubscriptionChannelIdentifier["CurrentUrl"] = "CurrentUrl";
    SubscriptionChannelIdentifier["StrictMode"] = "StrictMode";
    SubscriptionChannelIdentifier["UserManager"] = "UserManager";
})(SubscriptionChannelIdentifier || (SubscriptionChannelIdentifier = {}));
/// Save tableIDs subscribed to some changes
var ChromeCoreSubscriptionService = /** @class */ (function () {
    function ChromeCoreSubscriptionService() {
        this.channels = new Map([
            [SubscriptionChannelIdentifier.QuickBlock, new SubscriptionChannel(SubscriptionChannelIdentifier.QuickBlock)],
            [SubscriptionChannelIdentifier.ScheduleManager, new SubscriptionChannel(SubscriptionChannelIdentifier.ScheduleManager)],
            [SubscriptionChannelIdentifier.SharedPreferences, new SubscriptionChannel(SubscriptionChannelIdentifier.SharedPreferences)],
            [SubscriptionChannelIdentifier.CurrentUrl, new SubscriptionChannel(SubscriptionChannelIdentifier.CurrentUrl)],
            [SubscriptionChannelIdentifier.StrictMode, new SubscriptionChannel(SubscriptionChannelIdentifier.StrictMode)],
            [SubscriptionChannelIdentifier.UserManager, new SubscriptionChannel(SubscriptionChannelIdentifier.UserManager)]
            //TODO ADD Schedules or something else which needs to be synchronized
        ]);
        // public registerSubscriber(channel: SubscriptionChannelIdentifier, tabId: string): void {
        //     let _channel: SubscriptionChannel | undefined = this.channels.get(channel);
        //     if (_channel) {
        //         _channel.tabSubs.set(tabId, {});
        //     }
        // }
        // public unregisterFromAllChannels(tabId: string): void {
        //     this.channels.forEach((channel: SubscriptionChannel, key: SubscriptionChannelIdentifier) => {
        //         channel.tabSubs.delete(tabId);
        //     });
        // }
        // public unregisterSubscriber(channel: SubscriptionChannelIdentifier, tabId: string): void {
        //     let _channel: SubscriptionChannel | undefined = this.channels.get(channel);
        //     if (_channel) {
        //         _channel.tabSubs.delete(tabId);
        //     }
        // }
    }
    ChromeCoreSubscriptionService.prototype.getChannel = function (channel) {
        return this.channels.get(channel);
    };
    return ChromeCoreSubscriptionService;
}());
var ChromeCoreProtocol = /** @class */ (function () {
    function ChromeCoreProtocol(core) {
        var _this = this;
        this._subscriptionService = new ChromeCoreSubscriptionService();
        this.protocol = new Map([
            //Settings Messages
            [Interface.SharedPreferences.SubscribeChanges.RegisterSubscription.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.SharedPreferences.SubscribeChanges.RegisterSubscription();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    //console.log("RATING DIALOG SUBSCRIBING",data);
                    if (message && senderIdentifier) {
                        if (_this.core.sharedPreferences) {
                            sendResponse({ method: Interface.SharedPreferences.SubscribeChanges.SyncUpdate.identifier, data: _this.core.sharedPreferences });
                        }
                    }
                }],
            [Interface.SharedPreferences.State.UpdateOnboarding.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var settings = Settings.SharedPreferences.from(_this.core.sharedPreferences);
                    var stateCopy = settings.onboardingSettings;
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(stateCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[Settings.SharedPreferences.name] = Serializer.serialize(settings),
                        _a));
                }],
            [Interface.SharedPreferences.State.UpdateRatingDialog.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var settings = Settings.SharedPreferences.from(_this.core.sharedPreferences);
                    var stateCopy = settings.ratingDialogSettings;
                    //console.log("RATING DIALOG CHANGE",settings);
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(stateCopy, (_b = {}, _b[key] = value, _b));
                    });
                    //console.log("RATING DIALOG CHANGED",settings);
                    chrome.storage.local.set((_a = {},
                        _a[Settings.SharedPreferences.name] = Serializer.serialize(settings),
                        _a));
                }],
            [Interface.SharedPreferences.State.UpdateGlobalSettings.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var settings = Settings.SharedPreferences.from(_this.core.sharedPreferences);
                    var stateCopy = settings.globalSettings;
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(stateCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[Settings.SharedPreferences.name] = Serializer.serialize(settings),
                        _a));
                }],
            [Interface.SharedPreferences.State.UpdateGoogleAnalyticsSettings.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var settings = Settings.SharedPreferences.from(_this.core.sharedPreferences);
                    var stateCopy = settings.googleAnalyticsSettings;
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(stateCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[Settings.SharedPreferences.name] = Serializer.serialize(settings),
                        _a));
                }],
            [Interface.SharedPreferences.State.UpdateStrictModeHintSettings.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var settings = Settings.SharedPreferences.from(_this.core.sharedPreferences);
                    var stateCopy = settings.strictModeHintSettings;
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(stateCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[Settings.SharedPreferences.name] = Serializer.serialize(settings),
                        _a));
                }],
            //QuickBlock Messages
            [Interface.QuickBlock.SubscribeChanges.RegisterSubscription.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.QuickBlock.SubscribeChanges.RegisterSubscription();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    if (message && senderIdentifier) {
                        //this._subscriptionService.registerSubscriber(SubscriptionChannelIdentifier.QuickBlock, senderIdentifier);
                        if (_this.core.quickBlock) {
                            sendResponse({ method: Interface.QuickBlock.SubscribeChanges.SyncUpdate.identifier, data: _this.core.quickBlock });
                        }
                    }
                }],
            [Interface.QuickBlock.State.Update.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var deepCopy = QuickBlock.from(_this.core.quickBlock);
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(deepCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[QuickBlock.name] = Serializer.serialize(deepCopy),
                        _a));
                }],
            //Schedules Messages
            [Interface.Schedules.SubscribeChanges.RegisterSubscription.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.Schedules.SubscribeChanges.RegisterSubscription();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    if (message && senderIdentifier) {
                        // this._subscriptionService.registerSubscriber(SubscriptionChannelIdentifier.ScheduleManager, senderIdentifier);
                        if (_this.core.scheduleManager) {
                            sendResponse({ method: Interface.Schedules.SubscribeChanges.SyncUpdate.identifier, data: Serializer.serialize(_this.core.scheduleManager) });
                        }
                    }
                }],
            [Interface.Schedules.State.Update.identifier, function (stateUpdate /*Partial<ScheduleState>*/, sender, sendResponse) { return __awaiter(_this, void 0, void 0, function () {
                    var scheduleUpdate, deepCopy;
                    var _a;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                scheduleUpdate = Serializer.deserialize(stateUpdate);
                                deepCopy = Schedule.from((_b = this.core.scheduleManager.schedules.get(scheduleUpdate.id)) !== null && _b !== void 0 ? _b : Schedule.from(scheduleUpdate));
                                Object.entries(scheduleUpdate).forEach(function (_a) {
                                    var _b;
                                    var key = _a[0], value = _a[1];
                                    if (value === undefined)
                                        return;
                                    Object.assign(deepCopy, (_b = {}, _b[key] = value, _b));
                                });
                                this.core.scheduleManager.schedules.set(scheduleUpdate.id, deepCopy);
                                return [4 /*yield*/, chrome.storage.local.set((_a = {},
                                        _a[ScheduleManager.name] = Serializer.serialize(this.core.scheduleManager),
                                        _a))];
                            case 1:
                                _c.sent();
                                sendResponse();
                                return [2 /*return*/, true];
                        }
                    });
                }); }],
            [Interface.Schedules.State.Delete.identifier, function (scheduleId /*Partial<ScheduleState>*/, sender, sendResponse) {
                    var _a;
                    var deleteScheduleId = Number(scheduleId);
                    _this.core.scheduleManager.schedules.delete(deleteScheduleId);
                    chrome.storage.local.set((_a = {},
                        _a[ScheduleManager.name] = Serializer.serialize(_this.core.scheduleManager),
                        _a));
                }],
            //StrictMode Messages
            [Interface.StrictMode.SubscribeChanges.RegisterSubscription.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.StrictMode.SubscribeChanges.RegisterSubscription();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    if (message && senderIdentifier) {
                        if (_this.core.strictMode) {
                            sendResponse({ method: Interface.StrictMode.SubscribeChanges.SyncUpdate.identifier, data: _this.core.strictMode });
                        }
                    }
                }],
            [Interface.StrictMode.State.Update.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var deepCopy = StrictMode.from(_this.core.strictMode);
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(deepCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[StrictMode.name] = Serializer.serialize(deepCopy),
                        _a));
                }],
            [Interface.UserManager.SubscribeChanges.RegisterSubscription.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.UserManager.SubscribeChanges.RegisterSubscription();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    if (message && senderIdentifier) {
                        //this._subscriptionService.registerSubscriber(SubscriptionChannelIdentifier.QuickBlock, senderIdentifier);
                        if (_this.core.userManager) {
                            sendResponse({ method: Interface.UserManager.SubscribeChanges.SyncUpdate.identifier, data: _this.core.userManager });
                        }
                    }
                }],
            [Interface.UserManager.State.Update.identifier, function (stateUpdate, sender, sendResponse) {
                    var _a;
                    var deepCopy = UserManager.from(_this.core.userManager);
                    Object.entries(stateUpdate).forEach(function (_a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        if (value === undefined)
                            return;
                        Object.assign(deepCopy, (_b = {}, _b[key] = value, _b));
                    });
                    chrome.storage.local.set((_a = {},
                        _a[UserManager.name] = Serializer.serialize(deepCopy),
                        _a));
                }],
            //Content Script Messages
            [Interface.ContentScriptAPI.SubscribeTabUrl.identifier, function (data, sender, sendResponse) {
                    var _a, _b, _c;
                    var message = new Interface.ContentScriptAPI.SubscribeTabUrl();
                    var senderIdentifier = (_c = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : chrome.runtime.id;
                    if (message && senderIdentifier) {
                        // this._subscriptionService.registerSubscriber(SubscriptionChannelIdentifier.CurrentUrl, senderIdentifier);
                        sendResponse({
                            method: Interface.ContentScriptAPI.CurrentUrlUpdate.identifier,
                            data: { actualUrl: _this.core.actualUrl }
                        });
                    }
                }],
            [Interface.ContentScriptAPI.GetActiveBlocks.identifier, function (data, sender, sendResponse) {
                    var _a, _b;
                    var senderIdentifier = (_b = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString();
                    if (senderIdentifier) {
                        //Get QuickBlock block
                        var scheduleWebExpressions_1 = [];
                        var scheduleKeywordExpressions_1 = [];
                        _this.core.scheduleManager.schedules.forEach(function (schedule) {
                            if (schedule.isActive) {
                                scheduleWebExpressions_1 = __spreadArray(__spreadArray([], scheduleWebExpressions_1, true), schedule.activeWebExpressions, true);
                            }
                        });
                        _this.core.scheduleManager.schedules.forEach(function (schedule) {
                            if (schedule.isActive) {
                                scheduleKeywordExpressions_1 = __spreadArray(__spreadArray([], scheduleKeywordExpressions_1, true), schedule.activeKeywordExpressions, true);
                            }
                        });
                        var blockData = {
                            blockKeywordsExpressions: __spreadArray(__spreadArray([], _this.core.quickBlock.isActive ? _this.core.quickBlock.activeKeywordExpressions : [], true), scheduleKeywordExpressions_1, true),
                            blockWebExpressions: __spreadArray(__spreadArray([], _this.core.quickBlock.isActive ? _this.core.quickBlock.activeWebExpressions : [], true), scheduleWebExpressions_1, true)
                        };
                        sendResponse({
                            method: Interface.ContentScriptAPI.GetActiveBlocksResponse.identifier,
                            data: blockData
                        });
                    }
                }]
        ]);
        this.onMessage = function (message, sender, sendResponse) {
            var callback = _this.protocol.get(message.method);
            if (callback) {
                callback(message.data, sender, sendResponse);
                return true;
            }
            else {
                return true;
            }
        };
        this.core = core;
    }
    ChromeCoreProtocol.prototype.notifySubscribers = function (channel, message, notifyWebTabs) {
        if (notifyWebTabs === void 0) { notifyWebTabs = true; }
        return __awaiter(this, void 0, void 0, function () {
            var channelInstance, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        channelInstance = this._subscriptionService.getChannel(channel);
                        if (!channelInstance) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, chrome.runtime.sendMessage(chrome.runtime.id, message)];
                    case 2:
                        _b.sent();
                        if (!(BuildConstants.platform == Platform.safari || notifyWebTabs)) return [3 /*break*/, 4];
                        return [4 /*yield*/, chrome.tabs.query({})];
                    case 3:
                        (_b.sent()).forEach(function (tab) {
                            try {
                                chrome.tabs.sendMessage(tab.id, message);
                            }
                            catch (_a) { }
                        });
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return ChromeCoreProtocol;
}());
export default ChromeCoreProtocol;
