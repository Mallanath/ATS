import { Translations } from "./translations.js";
import { Constants } from "../constants.js";
export var Lang = /** @class */ (function () {
    function Lang() {
    }
    Lang.tr = function (key) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (key == null)
            return "NULL";
        if (typeof window == "undefined")
            return key;
        var uiLang = this.getUiLang();
        var result = (_e = (_c = (_a = chrome.i18n.getMessage(key)) !== null && _a !== void 0 ? _a : (_b = Translations.data.get(uiLang)) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : (_d = Translations.data.get("en")) === null || _d === void 0 ? void 0 : _d[key]) !== null && _e !== void 0 ? _e : "";
        if (result == "") {
            result = (_j = (_g = (_f = Translations.data.get(uiLang)) === null || _f === void 0 ? void 0 : _f[key]) !== null && _g !== void 0 ? _g : (_h = Translations.data.get("en")) === null || _h === void 0 ? void 0 : _h[key]) !== null && _j !== void 0 ? _j : "";
        }
        return this.replaceVariables(result);
    };
    Lang.trReplaceVariables = function (key, variables) {
        var translation = Lang.tr(key);
        variables.forEach(function (variable) {
            translation = translation.replace(new RegExp(variable.variable, 'g'), variable.replace);
        });
        return translation;
    };
    Lang.trMultiline = function (key, variables) {
        if (variables) {
            return Lang.trReplaceVariables(key, variables).split("\n");
        }
        return Lang.tr(key).split("\n");
    };
    Lang.getUiLang = function () {
        var _a;
        if (typeof window == "undefined")
            return "en";
        return (_a = chrome.i18n.getUILanguage().split("-")[0]) !== null && _a !== void 0 ? _a : "en";
    };
    Lang.replaceVariables = function (result) {
        this.variables.forEach(function (variable) {
            result = result.replace(new RegExp(variable.variable, 'g'), variable.replace);
        });
        return result;
    };
    Lang.variables = [
        { variable: "%browserName%", replace: Constants.getBrowserName() },
    ];
    return Lang;
}());
