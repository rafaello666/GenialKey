"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMSC1_CODEC = void 0;
exports.parseIMSC1 = parseIMSC1;
var mp4_tools_1 = require("./mp4-tools");
var vttparser_1 = require("./vttparser");
var vttcue_1 = require("./vttcue");
var id3_1 = require("../demux/id3");
var timescale_conversion_1 = require("./timescale-conversion");
var webvtt_parser_1 = require("./webvtt-parser");
exports.IMSC1_CODEC = 'stpp.ttml.im1t';
// Time format: h:m:s:frames(.subframes)
var HMSF_REGEX = /^(\d{2,}):(\d{2}):(\d{2}):(\d{2})\.?(\d+)?$/;
// Time format: hours, minutes, seconds, milliseconds, frames, ticks
var TIME_UNIT_REGEX = /^(\d*(?:\.\d*)?)(h|m|s|ms|f|t)$/;
var textAlignToLineAlign = {
    left: 'start',
    center: 'center',
    right: 'end',
    start: 'start',
    end: 'end',
};
function parseIMSC1(payload, initPTS, callBack, errorCallBack) {
    var results = (0, mp4_tools_1.findBox)(new Uint8Array(payload), ['mdat']);
    if (results.length === 0) {
        errorCallBack(new Error('Could not parse IMSC1 mdat'));
        return;
    }
    var ttmlList = results.map(function (mdat) { return (0, id3_1.utf8ArrayToStr)(mdat); });
    var syncTime = (0, timescale_conversion_1.toTimescaleFromScale)(initPTS.baseTime, 1, initPTS.timescale);
    try {
        ttmlList.forEach(function (ttml) { return callBack(parseTTML(ttml, syncTime)); });
    }
    catch (error) {
        errorCallBack(error);
    }
}
function parseTTML(ttml, syncTime) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(ttml, 'text/xml');
    var tt = xmlDoc.getElementsByTagName('tt')[0];
    if (!tt) {
        throw new Error('Invalid ttml');
    }
    var defaultRateInfo = {
        frameRate: 30,
        subFrameRate: 1,
        frameRateMultiplier: 0,
        tickRate: 0,
    };
    var rateInfo = Object.keys(defaultRateInfo).reduce(function (result, key) {
        result[key] = tt.getAttribute("ttp:".concat(key)) || defaultRateInfo[key];
        return result;
    }, {});
    var trim = tt.getAttribute('xml:space') !== 'preserve';
    var styleElements = collectionToDictionary(getElementCollection(tt, 'styling', 'style'));
    var regionElements = collectionToDictionary(getElementCollection(tt, 'layout', 'region'));
    var cueElements = getElementCollection(tt, 'body', '[begin]');
    return [].map
        .call(cueElements, function (cueElement) {
        var cueText = getTextContent(cueElement, trim);
        if (!cueText || !cueElement.hasAttribute('begin')) {
            return null;
        }
        var startTime = parseTtmlTime(cueElement.getAttribute('begin'), rateInfo);
        var duration = parseTtmlTime(cueElement.getAttribute('dur'), rateInfo);
        var endTime = parseTtmlTime(cueElement.getAttribute('end'), rateInfo);
        if (startTime === null) {
            throw timestampParsingError(cueElement);
        }
        if (endTime === null) {
            if (duration === null) {
                throw timestampParsingError(cueElement);
            }
            endTime = startTime + duration;
        }
        var cue = new vttcue_1.default(startTime - syncTime, endTime - syncTime, cueText);
        cue.id = (0, webvtt_parser_1.generateCueId)(cue.startTime, cue.endTime, cue.text);
        var region = regionElements[cueElement.getAttribute('region')];
        var style = styleElements[cueElement.getAttribute('style')];
        // Apply styles to cue
        var styles = getTtmlStyles(region, style, styleElements);
        var textAlign = styles.textAlign;
        if (textAlign) {
            // cue.positionAlign not settable in FF~2016
            var lineAlign = textAlignToLineAlign[textAlign];
            if (lineAlign) {
                cue.lineAlign = lineAlign;
            }
            cue.align = textAlign;
        }
        Object.assign(cue, styles);
        return cue;
    })
        .filter(function (cue) { return cue !== null; });
}
function getElementCollection(fromElement, parentName, childName) {
    var parent = fromElement.getElementsByTagName(parentName)[0];
    if (parent) {
        return [].slice.call(parent.querySelectorAll(childName));
    }
    return [];
}
function collectionToDictionary(elementsWithId) {
    return elementsWithId.reduce(function (dict, element) {
        var id = element.getAttribute('xml:id');
        if (id) {
            dict[id] = element;
        }
        return dict;
    }, {});
}
function getTextContent(element, trim) {
    return [].slice.call(element.childNodes).reduce(function (str, node, i) {
        var _a;
        if (node.nodeName === 'br' && i) {
            return str + '\n';
        }
        if ((_a = node.childNodes) === null || _a === void 0 ? void 0 : _a.length) {
            return getTextContent(node, trim);
        }
        else if (trim) {
            return str + node.textContent.trim().replace(/\s+/g, ' ');
        }
        return str + node.textContent;
    }, '');
}
function getTtmlStyles(region, style, styleElements) {
    var ttsNs = 'http://www.w3.org/ns/ttml#styling';
    var regionStyle = null;
    var styleAttributes = [
        'displayAlign',
        'textAlign',
        'color',
        'backgroundColor',
        'fontSize',
        'fontFamily',
        // 'fontWeight',
        // 'lineHeight',
        // 'wrapOption',
        // 'fontStyle',
        // 'direction',
        // 'writingMode'
    ];
    var regionStyleName = (region === null || region === void 0 ? void 0 : region.hasAttribute('style'))
        ? region.getAttribute('style')
        : null;
    if (regionStyleName && styleElements.hasOwnProperty(regionStyleName)) {
        regionStyle = styleElements[regionStyleName];
    }
    return styleAttributes.reduce(function (styles, name) {
        var value = getAttributeNS(style, ttsNs, name) ||
            getAttributeNS(region, ttsNs, name) ||
            getAttributeNS(regionStyle, ttsNs, name);
        if (value) {
            styles[name] = value;
        }
        return styles;
    }, {});
}
function getAttributeNS(element, ns, name) {
    if (!element) {
        return null;
    }
    return element.hasAttributeNS(ns, name)
        ? element.getAttributeNS(ns, name)
        : null;
}
function timestampParsingError(node) {
    return new Error("Could not parse ttml timestamp ".concat(node));
}
function parseTtmlTime(timeAttributeValue, rateInfo) {
    if (!timeAttributeValue) {
        return null;
    }
    var seconds = (0, vttparser_1.parseTimeStamp)(timeAttributeValue);
    if (seconds === null) {
        if (HMSF_REGEX.test(timeAttributeValue)) {
            seconds = parseHoursMinutesSecondsFrames(timeAttributeValue, rateInfo);
        }
        else if (TIME_UNIT_REGEX.test(timeAttributeValue)) {
            seconds = parseTimeUnits(timeAttributeValue, rateInfo);
        }
    }
    return seconds;
}
function parseHoursMinutesSecondsFrames(timeAttributeValue, rateInfo) {
    var m = HMSF_REGEX.exec(timeAttributeValue);
    var frames = (m[4] | 0) + (m[5] | 0) / rateInfo.subFrameRate;
    return ((m[1] | 0) * 3600 +
        (m[2] | 0) * 60 +
        (m[3] | 0) +
        frames / rateInfo.frameRate);
}
function parseTimeUnits(timeAttributeValue, rateInfo) {
    var m = TIME_UNIT_REGEX.exec(timeAttributeValue);
    var value = Number(m[1]);
    var unit = m[2];
    switch (unit) {
        case 'h':
            return value * 3600;
        case 'm':
            return value * 60;
        case 'ms':
            return value * 1000;
        case 'f':
            return value / rateInfo.frameRate;
        case 't':
            return value / rateInfo.tickRate;
    }
    return value;
}
