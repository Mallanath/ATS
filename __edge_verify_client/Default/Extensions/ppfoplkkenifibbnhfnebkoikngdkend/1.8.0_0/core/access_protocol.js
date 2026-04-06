//QuickBlock Remote Access Protocol
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
var AppblockCoreIntefrace;
(function (AppblockCoreIntefrace) {
    var Message = /** @class */ (function () {
        function Message(data) {
            this.data = data;
        }
        return Message;
    }());
    //QuickBlock Interface
    var SharedPreferences;
    (function (SharedPreferences) {
        var SubscribeChanges;
        (function (SubscribeChanges) {
            ///Send From content to core and register for changes
            var RegisterSubscription = /** @class */ (function (_super) {
                __extends(RegisterSubscription, _super);
                function RegisterSubscription() {
                    return _super.call(this, null) || this;
                }
                RegisterSubscription.identifier = "SharedPreferences-Register-Subscription";
                return RegisterSubscription;
            }(Message));
            SubscribeChanges.RegisterSubscription = RegisterSubscription;
            //Send From Core to all subscribed contents
            var SyncUpdate = /** @class */ (function (_super) {
                __extends(SyncUpdate, _super);
                function SyncUpdate(data) {
                    return _super.call(this, data) || this;
                }
                SyncUpdate.identifier = "SharedPreferences-Sync-Update";
                return SyncUpdate;
            }(Message));
            SubscribeChanges.SyncUpdate = SyncUpdate;
        })(SubscribeChanges = SharedPreferences.SubscribeChanges || (SharedPreferences.SubscribeChanges = {}));
        var State;
        (function (State) {
            ///Send From content to core and register for changes
            var UpdateOnboarding = /** @class */ (function (_super) {
                __extends(UpdateOnboarding, _super);
                function UpdateOnboarding(data) {
                    return _super.call(this, data) || this;
                }
                UpdateOnboarding.identifier = "SharedPreferences-State-UpdateOnboarding";
                return UpdateOnboarding;
            }(Message));
            State.UpdateOnboarding = UpdateOnboarding;
            var UpdateRatingDialog = /** @class */ (function (_super) {
                __extends(UpdateRatingDialog, _super);
                function UpdateRatingDialog(data) {
                    return _super.call(this, data) || this;
                }
                UpdateRatingDialog.identifier = "SharedPreferences-State-UpdateRating";
                return UpdateRatingDialog;
            }(Message));
            State.UpdateRatingDialog = UpdateRatingDialog;
            var UpdateGlobalSettings = /** @class */ (function (_super) {
                __extends(UpdateGlobalSettings, _super);
                function UpdateGlobalSettings(data) {
                    return _super.call(this, data) || this;
                }
                UpdateGlobalSettings.identifier = "SharedPreferences-State-UpdateGlobalSettings";
                return UpdateGlobalSettings;
            }(Message));
            State.UpdateGlobalSettings = UpdateGlobalSettings;
            var UpdateGoogleAnalyticsSettings = /** @class */ (function (_super) {
                __extends(UpdateGoogleAnalyticsSettings, _super);
                function UpdateGoogleAnalyticsSettings(data) {
                    return _super.call(this, data) || this;
                }
                UpdateGoogleAnalyticsSettings.identifier = "SharedPreferences-State-UpdateGoogleAnalyticsSettings";
                return UpdateGoogleAnalyticsSettings;
            }(Message));
            State.UpdateGoogleAnalyticsSettings = UpdateGoogleAnalyticsSettings;
            var UpdateStrictModeHintSettings = /** @class */ (function (_super) {
                __extends(UpdateStrictModeHintSettings, _super);
                function UpdateStrictModeHintSettings(data) {
                    return _super.call(this, data) || this;
                }
                UpdateStrictModeHintSettings.identifier = "SharedPreferences-State-UpdateStrictModeHintSettings";
                return UpdateStrictModeHintSettings;
            }(Message));
            State.UpdateStrictModeHintSettings = UpdateStrictModeHintSettings;
        })(State = SharedPreferences.State || (SharedPreferences.State = {}));
    })(SharedPreferences = AppblockCoreIntefrace.SharedPreferences || (AppblockCoreIntefrace.SharedPreferences = {}));
    //QuickBlock Interface
    var QuickBlock;
    (function (QuickBlock) {
        var SubscribeChanges;
        (function (SubscribeChanges) {
            ///Send From content to core and register for changes
            var RegisterSubscription = /** @class */ (function (_super) {
                __extends(RegisterSubscription, _super);
                function RegisterSubscription() {
                    return _super.call(this, null) || this;
                }
                RegisterSubscription.identifier = "QuickBlock-Sync-Register-Subscription";
                return RegisterSubscription;
            }(Message));
            SubscribeChanges.RegisterSubscription = RegisterSubscription;
            //Send From Core to all subscribed contents
            var SyncUpdate = /** @class */ (function (_super) {
                __extends(SyncUpdate, _super);
                function SyncUpdate(data) {
                    return _super.call(this, data) || this;
                }
                SyncUpdate.identifier = "QuickBlock-Sync-Update";
                return SyncUpdate;
            }(Message));
            SubscribeChanges.SyncUpdate = SyncUpdate;
        })(SubscribeChanges = QuickBlock.SubscribeChanges || (QuickBlock.SubscribeChanges = {}));
        var State;
        (function (State) {
            ///Send From content to core and register for changes
            var Update = /** @class */ (function (_super) {
                __extends(Update, _super);
                function Update(data) {
                    return _super.call(this, data) || this;
                }
                Update.identifier = "QuickBlock-State-Update";
                return Update;
            }(Message));
            State.Update = Update;
        })(State = QuickBlock.State || (QuickBlock.State = {}));
    })(QuickBlock = AppblockCoreIntefrace.QuickBlock || (AppblockCoreIntefrace.QuickBlock = {}));
    var Schedules;
    (function (Schedules) {
        var SubscribeChanges;
        (function (SubscribeChanges) {
            ///Send From content to core and register for changes
            var RegisterSubscription = /** @class */ (function (_super) {
                __extends(RegisterSubscription, _super);
                function RegisterSubscription() {
                    return _super.call(this, null) || this;
                }
                RegisterSubscription.identifier = "ScheduleManager-Sync-Register-Subscription";
                return RegisterSubscription;
            }(Message));
            SubscribeChanges.RegisterSubscription = RegisterSubscription;
            //Send From Core to all subscribed contents
            var SyncUpdate = /** @class */ (function (_super) {
                __extends(SyncUpdate, _super);
                function SyncUpdate(data) {
                    return _super.call(this, data) || this;
                }
                SyncUpdate.identifier = "Schedule-Sync-Update";
                return SyncUpdate;
            }(Message));
            SubscribeChanges.SyncUpdate = SyncUpdate;
        })(SubscribeChanges = Schedules.SubscribeChanges || (Schedules.SubscribeChanges = {}));
        var State;
        (function (State) {
            ///Send From content to core and register for changes
            var Update = /** @class */ (function (_super) {
                __extends(Update, _super);
                function Update(data) {
                    return _super.call(this, data) || this;
                }
                Update.identifier = "Schedule-State-Update";
                return Update;
            }(Message));
            State.Update = Update;
            var Delete = /** @class */ (function (_super) {
                __extends(Delete, _super);
                function Delete(data) {
                    return _super.call(this, data) || this;
                }
                Delete.identifier = "Schedule-State-Delete";
                return Delete;
            }(Message));
            State.Delete = Delete;
        })(State = Schedules.State || (Schedules.State = {}));
    })(Schedules = AppblockCoreIntefrace.Schedules || (AppblockCoreIntefrace.Schedules = {}));
    //UserManager
    var UserManager;
    (function (UserManager) {
        var SubscribeChanges;
        (function (SubscribeChanges) {
            ///Send From content to core and register for changes
            var RegisterSubscription = /** @class */ (function (_super) {
                __extends(RegisterSubscription, _super);
                function RegisterSubscription() {
                    return _super.call(this, null) || this;
                }
                RegisterSubscription.identifier = "UserManager-Sync-Register-Subscription";
                return RegisterSubscription;
            }(Message));
            SubscribeChanges.RegisterSubscription = RegisterSubscription;
            //Send From Core to all subscribed contents
            var SyncUpdate = /** @class */ (function (_super) {
                __extends(SyncUpdate, _super);
                function SyncUpdate(data) {
                    return _super.call(this, data) || this;
                }
                SyncUpdate.identifier = "UserManager-Sync-Update";
                return SyncUpdate;
            }(Message));
            SubscribeChanges.SyncUpdate = SyncUpdate;
        })(SubscribeChanges = UserManager.SubscribeChanges || (UserManager.SubscribeChanges = {}));
        var State;
        (function (State) {
            ///Send From content to core and register for changes
            var Update = /** @class */ (function (_super) {
                __extends(Update, _super);
                function Update(data) {
                    return _super.call(this, data) || this;
                }
                Update.identifier = "UserManager-State-Update";
                return Update;
            }(Message));
            State.Update = Update;
        })(State = UserManager.State || (UserManager.State = {}));
    })(UserManager = AppblockCoreIntefrace.UserManager || (AppblockCoreIntefrace.UserManager = {}));
    //StrictMode
    var StrictMode;
    (function (StrictMode) {
        var SubscribeChanges;
        (function (SubscribeChanges) {
            ///Send From content to core and register for changes
            var RegisterSubscription = /** @class */ (function (_super) {
                __extends(RegisterSubscription, _super);
                function RegisterSubscription() {
                    return _super.call(this, null) || this;
                }
                RegisterSubscription.identifier = "StrictMode-Sync-Register-Subscription";
                return RegisterSubscription;
            }(Message));
            SubscribeChanges.RegisterSubscription = RegisterSubscription;
            //Send From Core to all subscribed contents
            var SyncUpdate = /** @class */ (function (_super) {
                __extends(SyncUpdate, _super);
                function SyncUpdate(data) {
                    return _super.call(this, data) || this;
                }
                SyncUpdate.identifier = "StrictMode-Sync-Update";
                return SyncUpdate;
            }(Message));
            SubscribeChanges.SyncUpdate = SyncUpdate;
        })(SubscribeChanges = StrictMode.SubscribeChanges || (StrictMode.SubscribeChanges = {}));
        var State;
        (function (State) {
            ///Send From content to core and register for changes
            var Update = /** @class */ (function (_super) {
                __extends(Update, _super);
                function Update(data) {
                    return _super.call(this, data) || this;
                }
                Update.identifier = "StrictMode-State-Update";
                return Update;
            }(Message));
            State.Update = Update;
        })(State = StrictMode.State || (StrictMode.State = {}));
    })(StrictMode = AppblockCoreIntefrace.StrictMode || (AppblockCoreIntefrace.StrictMode = {}));
    var ContentScriptAPI;
    (function (ContentScriptAPI) {
        //Send From Core to all subscribed contents
        var SubscribeTabUrl = /** @class */ (function (_super) {
            __extends(SubscribeTabUrl, _super);
            function SubscribeTabUrl() {
                return _super.call(this, null) || this;
            }
            SubscribeTabUrl.identifier = "ContentScriptAPI-SubscribeTabUrl";
            return SubscribeTabUrl;
        }(Message));
        ContentScriptAPI.SubscribeTabUrl = SubscribeTabUrl;
        var CurrentUrlUpdate = /** @class */ (function (_super) {
            __extends(CurrentUrlUpdate, _super);
            function CurrentUrlUpdate() {
                return _super.call(this, null) || this;
            }
            CurrentUrlUpdate.identifier = "ContentScriptAPI-CurrentUrlUpdate";
            return CurrentUrlUpdate;
        }(Message));
        ContentScriptAPI.CurrentUrlUpdate = CurrentUrlUpdate;
        var GetActiveBlocks = /** @class */ (function (_super) {
            __extends(GetActiveBlocks, _super);
            function GetActiveBlocks() {
                return _super.call(this, null) || this;
            }
            GetActiveBlocks.identifier = "ContentScriptAPI-GetActiveBlocks";
            return GetActiveBlocks;
        }(Message));
        ContentScriptAPI.GetActiveBlocks = GetActiveBlocks;
        var GetActiveBlocksResponse = /** @class */ (function (_super) {
            __extends(GetActiveBlocksResponse, _super);
            function GetActiveBlocksResponse(data) {
                return _super.call(this, data) || this;
            }
            GetActiveBlocksResponse.identifier = "ContentScriptAPI-GetActiveBlocks-Response";
            return GetActiveBlocksResponse;
        }(Message));
        ContentScriptAPI.GetActiveBlocksResponse = GetActiveBlocksResponse;
    })(ContentScriptAPI = AppblockCoreIntefrace.ContentScriptAPI || (AppblockCoreIntefrace.ContentScriptAPI = {}));
})(AppblockCoreIntefrace || (AppblockCoreIntefrace = {}));
export default AppblockCoreIntefrace;
