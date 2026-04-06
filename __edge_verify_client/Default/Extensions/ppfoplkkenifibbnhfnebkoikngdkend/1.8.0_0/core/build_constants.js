"use strict";
var Platform;
(function (Platform) {
    Platform[Platform["chrome"] = 0] = "chrome";
    Platform[Platform["safari"] = 1] = "safari";
})(Platform || (Platform = {}));
var BuildConstants = /** @class */ (function () {
    function BuildConstants() {
    }
    BuildConstants.platform = Platform.chrome;
    return BuildConstants;
}());
