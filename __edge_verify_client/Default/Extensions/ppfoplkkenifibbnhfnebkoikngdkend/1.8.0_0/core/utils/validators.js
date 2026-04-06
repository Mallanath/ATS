import { BlockExpressionType } from "../common/blocking_expressions.js";
var Validator = /** @class */ (function () {
    function Validator() {
    }
    Validator.getFirstWord = function (wordsString) {
        var words = wordsString.split(' ');
        return words[0];
    };
    Validator.getFormattedWords = function (wordsString) {
        var textParts = wordsString.split(" ");
        var textPartsSpans = [];
        textParts.forEach(function (item, index) {
            if (index === 0) {
                textPartsSpans.push(item);
            }
            else {
                textPartsSpans.push("<span>" + item + "</span>");
            }
        });
        return textPartsSpans;
    };
    Validator.formatUrl = function (url, formatForInput) {
        var formattedUrl = url.trim();
        var startWith = null;
        Validator.getBannedSubstringsInUrl().forEach(function (bannedSubstring) {
            if (formattedUrl.startsWith(bannedSubstring)) {
                startWith = bannedSubstring;
            }
        });
        if (startWith != null) {
            var replaceValue = formatForInput ? '<span>' + startWith + '</span>' : '';
            formattedUrl = formattedUrl.replace(new RegExp(startWith, ''), replaceValue);
        }
        if (formattedUrl.endsWith("/")) {
            var replaceSlash = formatForInput ? '<span>/</span>' : '';
            formattedUrl = formattedUrl.replace(/\/$/, replaceSlash);
        }
        return formattedUrl;
    };
    Validator.formatKeyword = function (keyword, formatForInput) {
        var formattedKeyword = keyword;
        formattedKeyword = formattedKeyword.replace(/^\s+/, "");
        var textNewParts = formattedKeyword.split('');
        var textPartsSpans = [];
        var fromIndex = 9999999;
        textNewParts.forEach(function (item, index) {
            if ((/[^a-zA-Z0-9 ]/.test(item)) || index > fromIndex) {
                fromIndex = index;
                if (formatForInput) {
                    textPartsSpans.push("<span>" + item + "</span>");
                }
            }
            else {
                textPartsSpans.push(item);
            }
        });
        formattedKeyword = textPartsSpans.join("");
        return formattedKeyword;
    };
    Validator.getBannedSubstringsInUrl = function () {
        return ["www.", "http://", "https://", "http://www.", "https://www."];
    };
    //Returns error message or null if text is valid
    Validator.blockedExpression = function (target, value, type, ignore) {
        var _a, _b, _c;
        value = value.trim();
        var isEmpty = (value == "");
        if (type == BlockExpressionType.website) {
            value = Validator.formatUrl(Validator.getFirstWord(value), false);
        }
        if (type == BlockExpressionType.keyword) {
            value = Validator.formatKeyword(Validator.getFirstWord(value), false);
        }
        var normalisedValue = value.toLowerCase().trim();
        var isValid = (type == BlockExpressionType.keyword && value != "") || this.isValidWebsite(value);
        var blockerExpression = (_a = target === null || target === void 0 ? void 0 : target.getBlockList(type)) === null || _a === void 0 ? void 0 : _a.find(function (e) { return e.expression.toLowerCase() === normalisedValue
            && !ignore.some(function (x) { return x.expression.toLowerCase().trim() == normalisedValue; }); });
        if (type == BlockExpressionType.keyword) {
            normalisedValue = value.trim();
            isValid = (type == BlockExpressionType.keyword && value != "") || this.isValidWebsite(value);
            blockerExpression = (_b = target === null || target === void 0 ? void 0 : target.getBlockList(type)) === null || _b === void 0 ? void 0 : _b.find(function (e) { return e.expression === normalisedValue
                && !ignore.some(function (x) { return x.expression.trim() == normalisedValue; }); });
        }
        return { isValid: isValid, isAlreadyBlocked: blockerExpression != undefined, isActive: (_c = blockerExpression === null || blockerExpression === void 0 ? void 0 : blockerExpression.isActive) !== null && _c !== void 0 ? _c : false, isEmpty: isEmpty };
    };
    Validator.scheduleDays = function (schedule) {
        return schedule.days.size > 0;
    };
    Validator.isValidWebsite = function (website) {
        var res = website.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        if (res == null) {
            var resLocalhost = website.match(/(http(s)?:\/\/.)?(localhost)(:[0-9]+)?\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
            if (resLocalhost !== null) {
                return true;
            }
            return false;
        }
        return true;
    };
    return Validator;
}());
export { Validator };
