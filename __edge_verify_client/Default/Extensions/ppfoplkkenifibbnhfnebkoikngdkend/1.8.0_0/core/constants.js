var _a;
export var Platforms;
(function (Platforms) {
    Platforms[Platforms["safari"] = 0] = "safari";
    Platforms[Platforms["opera"] = 1] = "opera";
    Platforms[Platforms["chrome"] = 2] = "chrome";
    Platforms[Platforms["firefox"] = 3] = "firefox";
    Platforms[Platforms["edge"] = 4] = "edge";
})(Platforms || (Platforms = {}));
var PlatformsConfiguration = (_a = {},
    _a[Platforms.safari] = {
        "name": "Safari",
        "android": "https://play.google.com/store/apps/details?id=cz.mobilesoft.appblock&referrer=utm_source%3DExtension%26utm_medium%3Dsafari",
        "ios": "https://apps.apple.com/app/apple-store/id1515753232?pt=117756378&ct=Extension_Safari&mt=8",
        "email": "safari@appblock.app",
        "instructions": "https://appblock.app/extensions/safari/",
        "store": "https://apps.apple.com/cz/app/appblock-block-websites/id6470454261?mt=12"
    },
    _a[Platforms.opera] = {
        "name": "Opera",
        "android": "https://play.google.com/store/apps/details?id=cz.mobilesoft.appblock&referrer=utm_source%3DExtension%26utm_medium%3DOpera",
        "ios": "https://apps.apple.com/app/apple-store/id1515753232?pt=117756378&ct=Extension_Opera&mt=8",
        "email": "opera@appblock.app",
        "instructions": "https://appblock.app/extensions/opera/",
        "store": ""
    },
    _a[Platforms.chrome] = {
        "name": "Chrome",
        "android": "https://play.google.com/store/apps/details?id=cz.mobilesoft.appblock&referrer=utm_source%3DExtension%26utm_medium%3Dchrome",
        "ios": "https://apps.apple.com/app/apple-store/id1515753232?pt=117756378&ct=Extension_Chrome&mt=8",
        "email": "chrome@appblock.app",
        "instructions": "https://appblock.app/extensions/chrome/",
        "store": "https://chrome.google.com/webstore/detail/appblock-block-sites-stay"
    },
    _a[Platforms.firefox] = {
        "name": "Firefox",
        "android": "https://play.google.com/store/apps/details?id=cz.mobilesoft.appblock&referrer=utm_source%3DExtension%26utm_medium%3Dfirefox",
        "ios": "https://apps.apple.com/app/apple-store/id1515753232?pt=117756378&ct=Extension_Firefox&mt=8",
        "email": "firefox@appblock.app",
        "instructions": "https://appblock.app/extensions/firefox/",
        "store": ""
    },
    _a[Platforms.edge] = {
        "name": "Edge",
        "android": "https://play.google.com/store/apps/details?id=cz.mobilesoft.appblock&referrer=utm_source%3DExtension%26utm_medium%3Dedge",
        "ios": "https://apps.apple.com/app/apple-store/id1515753232?pt=117756378&ct=Extension_Edge&mt=8",
        "email": "edge@appblock.app",
        "instructions": "https://appblock.app/extensions/edge/",
        "store": "https://microsoftedge.microsoft.com/addons/detail/appblock-block-sites-/ppfoplkkenifibbnhfnebkoikngdkend"
    },
    _a);
export var Constants = /** @class */ (function () {
    function Constants() {
    }
    Constants.isSafari = function () { return Constants.buildPlatform == Platforms.safari; };
    ;
    Constants.isChrome = function () { return Constants.buildPlatform == Platforms.chrome; };
    ;
    Constants.isEdge = function () { return Constants.buildPlatform == Platforms.edge; };
    ;
    Constants.getBrowserName = function () {
        return PlatformsConfiguration[Constants.buildPlatform].name;
    };
    ;
    Constants.getAndroidLink = function () {
        return PlatformsConfiguration[Constants.buildPlatform].android;
    };
    ;
    Constants.getIosLink = function () {
        return PlatformsConfiguration[Constants.buildPlatform].ios;
    };
    ;
    Constants.getEmail = function () {
        return PlatformsConfiguration[Constants.buildPlatform].email;
    };
    ;
    Constants.getInstructionsLink = function () {
        return PlatformsConfiguration[Constants.buildPlatform].instructions;
    };
    ;
    Constants.getStoreLink = function () {
        return PlatformsConfiguration[Constants.buildPlatform].store;
    };
    ;
    //TODO SET BEFORE BUILD
    Constants.buildPlatform = Platforms.edge;
    return Constants;
}());
