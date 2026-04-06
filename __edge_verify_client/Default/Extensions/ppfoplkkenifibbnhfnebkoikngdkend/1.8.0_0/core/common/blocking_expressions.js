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
var BlockExpressionType;
(function (BlockExpressionType) {
    BlockExpressionType["website"] = "website";
    BlockExpressionType["keyword"] = "keyword";
})(BlockExpressionType || (BlockExpressionType = {}));
var BlockMode;
(function (BlockMode) {
    BlockMode["allowlist"] = "allowlist";
    BlockMode["blocklist"] = "blocklist";
})(BlockMode || (BlockMode = {}));
var BlockExpression = /** @class */ (function () {
    function BlockExpression(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.expression, expression = _c === void 0 ? "" : _c, _d = _b.isActive, isActive = _d === void 0 ? false : _d, _e = _b.blockMode, blockMode = _e === void 0 ? BlockMode.blocklist : _e, _f = _b.blocklistName, blocklistName = _f === void 0 ? null : _f;
        this.isActive = false;
        this.expression = "";
        this.blockMode = BlockMode.blocklist;
        this.blocklistName = null;
        this.isActive = isActive;
        this.expression = expression;
        this.blockMode = blockMode;
        this.blocklistName = blocklistName;
    }
    BlockExpression.prototype.copyFrom = function (other) {
        this.isActive = other.isActive;
        this.expression = other.expression;
        this.blockMode = other.blockMode;
        this.blocklistName = other.blocklistName;
    };
    BlockExpression.fromType = function (type) {
        switch (type) {
            case BlockExpressionType.keyword:
                return new KeywordBlockExpression();
            case BlockExpressionType.website:
                return new BlockExpression();
        }
    };
    return BlockExpression;
}());
var UrlBlockMode;
(function (UrlBlockMode) {
    UrlBlockMode["domain"] = "domain";
    UrlBlockMode["url"] = "url";
})(UrlBlockMode || (UrlBlockMode = {}));
var KeywordBlockExpression = /** @class */ (function (_super) {
    __extends(KeywordBlockExpression, _super);
    function KeywordBlockExpression(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.expression, expression = _c === void 0 ? "" : _c, _d = _b.isActive, isActive = _d === void 0 ? false : _d, _e = _b.urlBlockMode, urlBlockMode = _e === void 0 ? UrlBlockMode.domain : _e, _f = _b.blockContent, blockContent = _f === void 0 ? false : _f;
        var _this = _super.call(this, { expression: expression, isActive: isActive }) || this;
        _this.urlBlockMode = UrlBlockMode.domain;
        _this.blockContent = true;
        _this.urlBlockMode = urlBlockMode;
        _this.blockContent = blockContent;
        return _this;
    }
    KeywordBlockExpression.prototype.copyFrom = function (other) {
        _super.prototype.copyFrom.call(this, other);
        this.urlBlockMode = other.urlBlockMode;
        this.blockContent = other.blockContent;
    };
    return KeywordBlockExpression;
}(BlockExpression));
var ExpressionBlocker = /** @class */ (function () {
    function ExpressionBlocker() {
        this.blockMode = BlockMode.blocklist;
        this.blockWebExpressions = new Array();
        this.blockKeywordsExpressions = new Array();
    }
    ExpressionBlocker.prototype.getBlockedExpression = function (keyword, type) {
        var expressions = [];
        switch (type) {
            case BlockExpressionType.website:
                expressions = this.blockWebExpressions.filter(function (e) { return e.expression.toLowerCase() == keyword.toLowerCase(); });
                break;
            case BlockExpressionType.keyword:
                expressions = this.blockKeywordsExpressions.filter(function (e) { return e.expression == keyword; });
                break;
        }
        return expressions.length > 0 ? expressions[0] : null;
    };
    ExpressionBlocker.prototype.getBlockList = function (type) {
        switch (type) {
            case BlockExpressionType.website: return this.blockWebExpressions;
            case BlockExpressionType.keyword: return this.blockKeywordsExpressions;
        }
    };
    ExpressionBlocker.prototype.getActiveBlockList = function (type) {
        switch (type) {
            case BlockExpressionType.website: return this.activeWebExpressions;
            case BlockExpressionType.keyword: return this.activeKeywordExpressions;
        }
    };
    ExpressionBlocker.prototype.setBlockList = function (type, value) {
        switch (type) {
            case BlockExpressionType.website:
                this.blockWebExpressions = value;
                break;
            case BlockExpressionType.keyword:
                this.blockKeywordsExpressions = value;
                break;
        }
    };
    Object.defineProperty(ExpressionBlocker.prototype, "totalExpressionsCount", {
        get: function () {
            return this.activeWebExpressions.length + this.activeKeywordExpressions.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExpressionBlocker.prototype, "activeWebExpressions", {
        get: function () {
            return this.blockWebExpressions.filter(function (element) { return element.isActive; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExpressionBlocker.prototype, "activeKeywordExpressions", {
        get: function () {
            return this.blockKeywordsExpressions.filter(function (element) { return element.isActive; });
        },
        enumerable: false,
        configurable: true
    });
    return ExpressionBlocker;
}());
export { ExpressionBlocker, UrlBlockMode, BlockExpression, KeywordBlockExpression, BlockExpressionType, BlockMode, };
