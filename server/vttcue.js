"use strict";
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var global_1 = require("./global");
exports.default = (function () {
    if (global_1.optionalSelf === null || global_1.optionalSelf === void 0 ? void 0 : global_1.optionalSelf.VTTCue) {
        return self.VTTCue;
    }
    var AllowedDirections = ['', 'lr', 'rl'];
    var AllowedAlignments = [
        'start',
        'middle',
        'end',
        'left',
        'right',
    ];
    function isAllowedValue(allowed, value) {
        if (typeof value !== 'string') {
            return false;
        }
        // necessary for assuring the generic conforms to the Array interface
        if (!Array.isArray(allowed)) {
            return false;
        }
        // reset the type so that the next narrowing works well
        var lcValue = value.toLowerCase();
        // use the allow list to narrow the type to a specific subset of strings
        if (~allowed.indexOf(lcValue)) {
            return lcValue;
        }
        return false;
    }
    function findDirectionSetting(value) {
        return isAllowedValue(AllowedDirections, value);
    }
    function findAlignSetting(value) {
        return isAllowedValue(AllowedAlignments, value);
    }
    function extend(obj) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var i = 1;
        for (; i < arguments.length; i++) {
            var cobj = arguments[i];
            for (var p in cobj) {
                obj[p] = cobj[p];
            }
        }
        return obj;
    }
    function VTTCue(startTime, endTime, text) {
        var cue = this;
        var baseObj = { enumerable: true };
        /**
         * Shim implementation specific properties. These properties are not in
         * the spec.
         */
        // Lets us know when the VTTCue's data has changed in such a way that we need
        // to recompute its display state. This lets us compute its display state
        // lazily.
        cue.hasBeenReset = false;
        /**
         * VTTCue and TextTrackCue properties
         * http://dev.w3.org/html5/webvtt/#vttcue-interface
         */
        var _id = '';
        var _pauseOnExit = false;
        var _startTime = startTime;
        var _endTime = endTime;
        var _text = text;
        var _region = null;
        var _vertical = '';
        var _snapToLines = true;
        var _line = 'auto';
        var _lineAlign = 'start';
        var _position = 50;
        var _positionAlign = 'middle';
        var _size = 50;
        var _align = 'middle';
        Object.defineProperty(cue, 'id', extend({}, baseObj, {
            get: function () {
                return _id;
            },
            set: function (value) {
                _id = '' + value;
            },
        }));
        Object.defineProperty(cue, 'pauseOnExit', extend({}, baseObj, {
            get: function () {
                return _pauseOnExit;
            },
            set: function (value) {
                _pauseOnExit = !!value;
            },
        }));
        Object.defineProperty(cue, 'startTime', extend({}, baseObj, {
            get: function () {
                return _startTime;
            },
            set: function (value) {
                if (typeof value !== 'number') {
                    throw new TypeError('Start time must be set to a number.');
                }
                _startTime = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'endTime', extend({}, baseObj, {
            get: function () {
                return _endTime;
            },
            set: function (value) {
                if (typeof value !== 'number') {
                    throw new TypeError('End time must be set to a number.');
                }
                _endTime = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'text', extend({}, baseObj, {
            get: function () {
                return _text;
            },
            set: function (value) {
                _text = '' + value;
                this.hasBeenReset = true;
            },
        }));
        // todo: implement VTTRegion polyfill?
        Object.defineProperty(cue, 'region', extend({}, baseObj, {
            get: function () {
                return _region;
            },
            set: function (value) {
                _region = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'vertical', extend({}, baseObj, {
            get: function () {
                return _vertical;
            },
            set: function (value) {
                var setting = findDirectionSetting(value);
                // Have to check for false because the setting an be an empty string.
                if (setting === false) {
                    throw new SyntaxError('An invalid or illegal string was specified.');
                }
                _vertical = setting;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'snapToLines', extend({}, baseObj, {
            get: function () {
                return _snapToLines;
            },
            set: function (value) {
                _snapToLines = !!value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'line', extend({}, baseObj, {
            get: function () {
                return _line;
            },
            set: function (value) {
                if (typeof value !== 'number' && value !== 'auto') {
                    throw new SyntaxError('An invalid number or illegal string was specified.');
                }
                _line = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'lineAlign', extend({}, baseObj, {
            get: function () {
                return _lineAlign;
            },
            set: function (value) {
                var setting = findAlignSetting(value);
                if (!setting) {
                    throw new SyntaxError('An invalid or illegal string was specified.');
                }
                _lineAlign = setting;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'position', extend({}, baseObj, {
            get: function () {
                return _position;
            },
            set: function (value) {
                if (value < 0 || value > 100) {
                    throw new Error('Position must be between 0 and 100.');
                }
                _position = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'positionAlign', extend({}, baseObj, {
            get: function () {
                return _positionAlign;
            },
            set: function (value) {
                var setting = findAlignSetting(value);
                if (!setting) {
                    throw new SyntaxError('An invalid or illegal string was specified.');
                }
                _positionAlign = setting;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'size', extend({}, baseObj, {
            get: function () {
                return _size;
            },
            set: function (value) {
                if (value < 0 || value > 100) {
                    throw new Error('Size must be between 0 and 100.');
                }
                _size = value;
                this.hasBeenReset = true;
            },
        }));
        Object.defineProperty(cue, 'align', extend({}, baseObj, {
            get: function () {
                return _align;
            },
            set: function (value) {
                var setting = findAlignSetting(value);
                if (!setting) {
                    throw new SyntaxError('An invalid or illegal string was specified.');
                }
                _align = setting;
                this.hasBeenReset = true;
            },
        }));
        /**
         * Other <track> spec defined properties
         */
        // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#text-track-cue-display-state
        cue.displayState = undefined;
    }
    /**
     * VTTCue methods
     */
    VTTCue.prototype.getCueAsHTML = function () {
        // Assume WebVTT.convertCueToDOMTree is on the global.
        var WebVTT = self.WebVTT;
        return WebVTT.convertCueToDOMTree(self, this.text);
    };
    // this is a polyfill hack
    return VTTCue;
})();
