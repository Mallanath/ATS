import { Serializer } from "../utils/serializer.js";
var OnboardingSettings = /** @class */ (function () {
    function OnboardingSettings() {
        this.firstLoad = true;
    }
    OnboardingSettings.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new OnboardingSettings());
        }
        else {
            newInstance = Serializer.clone(another, new OnboardingSettings());
        }
        return newInstance;
    };
    return OnboardingSettings;
}());
export { OnboardingSettings };
var RatingDialogSettings = /** @class */ (function () {
    function RatingDialogSettings() {
        this.quickBlockStarted = 0;
        this.schedulesCreated = 0;
        this.shownForSchedule = 0;
        this.shownForQuickBlock = 0;
    }
    RatingDialogSettings.prototype.registerQuickBlockStartedEvent = function () {
        this.quickBlockStarted++;
    };
    RatingDialogSettings.prototype.registerShownForQuickBlock = function () {
        this.shownForSchedule++;
    };
    RatingDialogSettings.prototype.registerShownForSchedule = function () {
        this.shownForSchedule++;
    };
    RatingDialogSettings.prototype.registerScheduleCreatedEvent = function () {
        this.schedulesCreated++;
    };
    RatingDialogSettings.prototype.shouldOpenDialog = function () {
        var hasAlreadyShown = this.shownForQuickBlock > 0 || this.shownForSchedule > 0;
        if (!hasAlreadyShown) {
            return this.quickBlockStarted == 2 || this.schedulesCreated == 1;
        }
        return false;
    };
    RatingDialogSettings.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new RatingDialogSettings());
        }
        else {
            newInstance = Serializer.clone(another, new RatingDialogSettings());
        }
        return newInstance;
    };
    return RatingDialogSettings;
}());
export { RatingDialogSettings };
var GlobalSettings = /** @class */ (function () {
    function GlobalSettings() {
        this.devMode = false;
    }
    GlobalSettings.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new GlobalSettings());
        }
        else {
            newInstance = Serializer.clone(another, new GlobalSettings());
        }
        return newInstance;
    };
    return GlobalSettings;
}());
export { GlobalSettings };
var GoogleAnalyticsSettings = /** @class */ (function () {
    function GoogleAnalyticsSettings() {
        this.clientId = "";
    }
    GoogleAnalyticsSettings.prototype.generateClientId = function () {
        return self.crypto.randomUUID();
    };
    GoogleAnalyticsSettings.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new GoogleAnalyticsSettings());
        }
        else {
            newInstance = Serializer.clone(another, new GoogleAnalyticsSettings());
        }
        return newInstance;
    };
    return GoogleAnalyticsSettings;
}());
export { GoogleAnalyticsSettings };
var StrictModeHintSettings = /** @class */ (function () {
    function StrictModeHintSettings() {
        this.clickNotNow = 0;
        this.notShowDialog = false;
        this.notShowUntilTime = 0;
    }
    StrictModeHintSettings.prototype.registerClickNotNowEvent = function () {
        this.clickNotNow++;
    };
    StrictModeHintSettings.prototype.registerNotShowDialogEvent = function () {
        this.notShowDialog = true;
    };
    StrictModeHintSettings.prototype.shouldOpenDialog = function () {
        if (this.notShowDialog) {
            return false;
        }
        var time = new Date().getTime();
        if (this.notShowUntilTime != 0 && this.notShowUntilTime > time) {
            return false;
        }
        var now = new Date();
        //24 hours
        this.notShowUntilTime = now.getTime() + (1000 * 60 * 60 * 24);
        return true;
    };
    StrictModeHintSettings.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new StrictModeHintSettings());
        }
        else {
            newInstance = Serializer.clone(another, new StrictModeHintSettings());
        }
        return newInstance;
    };
    return StrictModeHintSettings;
}());
export { StrictModeHintSettings };
var SharedPreferences = /** @class */ (function () {
    function SharedPreferences() {
        this.onboardingSettings = new OnboardingSettings();
        this.ratingDialogSettings = new RatingDialogSettings();
        this.globalSettings = new GlobalSettings();
        this.googleAnalyticsSettings = new GoogleAnalyticsSettings();
        this.strictModeHintSettings = new StrictModeHintSettings();
    }
    SharedPreferences.from = function (another) {
        var newManager;
        if (typeof another === 'string') {
            newManager = Serializer.deserialize(another, new SharedPreferences());
        }
        else {
            newManager = Serializer.clone(another, new SharedPreferences());
        }
        newManager.onboardingSettings = OnboardingSettings.from(newManager.onboardingSettings);
        newManager.ratingDialogSettings = RatingDialogSettings.from(newManager.ratingDialogSettings);
        newManager.globalSettings = GlobalSettings.from(newManager.globalSettings);
        newManager.googleAnalyticsSettings = GoogleAnalyticsSettings.from(newManager.googleAnalyticsSettings);
        newManager.strictModeHintSettings = StrictModeHintSettings.from(newManager.strictModeHintSettings);
        return newManager;
    };
    return SharedPreferences;
}());
export { SharedPreferences };
