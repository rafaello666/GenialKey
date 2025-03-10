"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = void 0;
exports.isDateRangeCueAttribute = isDateRangeCueAttribute;
exports.isSCTE35Attribute = isSCTE35Attribute;
var attr_list_1 = require("../utils/attr-list");
var logger_1 = require("../utils/logger");
function isDateRangeCueAttribute(attrName) {
    return (attrName !== "ID" /* DateRangeAttribute.ID */ &&
        attrName !== "CLASS" /* DateRangeAttribute.CLASS */ &&
        attrName !== "START-DATE" /* DateRangeAttribute.START_DATE */ &&
        attrName !== "DURATION" /* DateRangeAttribute.DURATION */ &&
        attrName !== "END-DATE" /* DateRangeAttribute.END_DATE */ &&
        attrName !== "END-ON-NEXT" /* DateRangeAttribute.END_ON_NEXT */);
}
function isSCTE35Attribute(attrName) {
    return (attrName === "SCTE35-OUT" /* DateRangeAttribute.SCTE35_OUT */ ||
        attrName === "SCTE35-IN" /* DateRangeAttribute.SCTE35_IN */);
}
var DateRange = /** @class */ (function () {
    function DateRange(dateRangeAttr, dateRangeWithSameId) {
        if (dateRangeWithSameId) {
            var previousAttr = dateRangeWithSameId.attr;
            for (var key in previousAttr) {
                if (Object.prototype.hasOwnProperty.call(dateRangeAttr, key) &&
                    dateRangeAttr[key] !== previousAttr[key]) {
                    logger_1.logger.warn("DATERANGE tag attribute: \"".concat(key, "\" does not match for tags with ID: \"").concat(dateRangeAttr.ID, "\""));
                    this._badValueForSameId = key;
                    break;
                }
            }
            // Merge DateRange tags with the same ID
            dateRangeAttr = Object.assign(new attr_list_1.AttrList({}), previousAttr, dateRangeAttr);
        }
        this.attr = dateRangeAttr;
        this._startDate = new Date(dateRangeAttr["START-DATE" /* DateRangeAttribute.START_DATE */]);
        if ("END-DATE" /* DateRangeAttribute.END_DATE */ in this.attr) {
            var endDate = new Date(this.attr["END-DATE" /* DateRangeAttribute.END_DATE */]);
            if (Number.isFinite(endDate.getTime())) {
                this._endDate = endDate;
            }
        }
    }
    Object.defineProperty(DateRange.prototype, "id", {
        get: function () {
            return this.attr.ID;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "class", {
        get: function () {
            return this.attr.CLASS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "startDate", {
        get: function () {
            return this._startDate;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "endDate", {
        get: function () {
            if (this._endDate) {
                return this._endDate;
            }
            var duration = this.duration;
            if (duration !== null) {
                return new Date(this._startDate.getTime() + duration * 1000);
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "duration", {
        get: function () {
            if ("DURATION" /* DateRangeAttribute.DURATION */ in this.attr) {
                var duration = this.attr.decimalFloatingPoint("DURATION" /* DateRangeAttribute.DURATION */);
                if (Number.isFinite(duration)) {
                    return duration;
                }
            }
            else if (this._endDate) {
                return (this._endDate.getTime() - this._startDate.getTime()) / 1000;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "plannedDuration", {
        get: function () {
            if ("PLANNED-DURATION" /* DateRangeAttribute.PLANNED_DURATION */ in this.attr) {
                return this.attr.decimalFloatingPoint("PLANNED-DURATION" /* DateRangeAttribute.PLANNED_DURATION */);
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "endOnNext", {
        get: function () {
            return this.attr.bool("END-ON-NEXT" /* DateRangeAttribute.END_ON_NEXT */);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateRange.prototype, "isValid", {
        get: function () {
            return (!!this.id &&
                !this._badValueForSameId &&
                Number.isFinite(this.startDate.getTime()) &&
                (this.duration === null || this.duration >= 0) &&
                (!this.endOnNext || !!this.class));
        },
        enumerable: false,
        configurable: true
    });
    return DateRange;
}());
exports.DateRange = DateRange;
