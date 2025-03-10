"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url_toolkit_1 = require("url-toolkit");
var date_range_1 = require("./date-range");
var fragment_1 = require("./fragment");
var level_details_1 = require("./level-details");
var level_key_1 = require("./level-key");
var attr_list_1 = require("../utils/attr-list");
var logger_1 = require("../utils/logger");
var variable_substitution_1 = require("../utils/variable-substitution");
var codecs_1 = require("../utils/codecs");
var MASTER_PLAYLIST_REGEX = /#EXT-X-STREAM-INF:([^\r\n]*)(?:[\r\n](?:#[^\r\n]*)?)*([^\r\n]+)|#EXT-X-(SESSION-DATA|SESSION-KEY|DEFINE|CONTENT-STEERING|START):([^\r\n]*)[\r\n]+/g;
var MASTER_PLAYLIST_MEDIA_REGEX = /#EXT-X-MEDIA:(.*)/g;
var IS_MEDIA_PLAYLIST = /^#EXT(?:INF|-X-TARGETDURATION):/m; // Handle empty Media Playlist (first EXTINF not signaled, but TARGETDURATION present)
var LEVEL_PLAYLIST_REGEX_FAST = new RegExp([
    /#EXTINF:\s*(\d*(?:\.\d+)?)(?:,(.*)\s+)?/.source, // duration (#EXTINF:<duration>,<title>), group 1 => duration, group 2 => title
    /(?!#) *(\S[^\r\n]*)/.source, // segment URI, group 3 => the URI (note newline is not eaten)
    /#EXT-X-BYTERANGE:*(.+)/.source, // next segment's byterange, group 4 => range spec (x@y)
    /#EXT-X-PROGRAM-DATE-TIME:(.+)/.source, // next segment's program date/time group 5 => the datetime spec
    /#.*/.source, // All other non-segment oriented tags will match with all groups empty
].join('|'), 'g');
var LEVEL_PLAYLIST_REGEX_SLOW = new RegExp([
    /#(EXTM3U)/.source,
    /#EXT-X-(DATERANGE|DEFINE|KEY|MAP|PART|PART-INF|PLAYLIST-TYPE|PRELOAD-HINT|RENDITION-REPORT|SERVER-CONTROL|SKIP|START):(.+)/
        .source,
    /#EXT-X-(BITRATE|DISCONTINUITY-SEQUENCE|MEDIA-SEQUENCE|TARGETDURATION|VERSION): *(\d+)/
        .source,
    /#EXT-X-(DISCONTINUITY|ENDLIST|GAP|INDEPENDENT-SEGMENTS)/.source,
    /(#)([^:]*):(.*)/.source,
    /(#)(.*)(?:.*)\r?\n?/.source,
].join('|'));
var M3U8Parser = /** @class */ (function () {
    function M3U8Parser() {
    }
    M3U8Parser.findGroup = function (groups, mediaGroupId) {
        for (var i = 0; i < groups.length; i++) {
            var group = groups[i];
            if (group.id === mediaGroupId) {
                return group;
            }
        }
    };
    M3U8Parser.resolve = function (url, baseUrl) {
        return (0, url_toolkit_1.buildAbsoluteURL)(baseUrl, url, { alwaysNormalize: true });
    };
    M3U8Parser.isMediaPlaylist = function (str) {
        return IS_MEDIA_PLAYLIST.test(str);
    };
    M3U8Parser.parseMasterPlaylist = function (string, baseurl) {
        var _a;
        var hasVariableRefs = __USE_VARIABLE_SUBSTITUTION__
            ? (0, variable_substitution_1.hasVariableReferences)(string)
            : false;
        var parsed = {
            contentSteering: null,
            levels: [],
            playlistParsingError: null,
            sessionData: null,
            sessionKeys: null,
            startTimeOffset: null,
            variableList: null,
            hasVariableRefs: hasVariableRefs,
        };
        var levelsWithKnownCodecs = [];
        MASTER_PLAYLIST_REGEX.lastIndex = 0;
        var result;
        while ((result = MASTER_PLAYLIST_REGEX.exec(string)) != null) {
            if (result[1]) {
                // '#EXT-X-STREAM-INF' is found, parse level tag  in group 1
                var attrs = new attr_list_1.AttrList(result[1]);
                if (__USE_VARIABLE_SUBSTITUTION__) {
                    (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, attrs, [
                        'CODECS',
                        'SUPPLEMENTAL-CODECS',
                        'ALLOWED-CPC',
                        'PATHWAY-ID',
                        'STABLE-VARIANT-ID',
                        'AUDIO',
                        'VIDEO',
                        'SUBTITLES',
                        'CLOSED-CAPTIONS',
                        'NAME',
                    ]);
                }
                var uri = __USE_VARIABLE_SUBSTITUTION__
                    ? (0, variable_substitution_1.substituteVariables)(parsed, result[2])
                    : result[2];
                var level = {
                    attrs: attrs,
                    bitrate: attrs.decimalInteger('BANDWIDTH') ||
                        attrs.decimalInteger('AVERAGE-BANDWIDTH'),
                    name: attrs.NAME,
                    url: M3U8Parser.resolve(uri, baseurl),
                };
                var resolution = attrs.decimalResolution('RESOLUTION');
                if (resolution) {
                    level.width = resolution.width;
                    level.height = resolution.height;
                }
                setCodecs(attrs.CODECS, level);
                if (!((_a = level.unknownCodecs) === null || _a === void 0 ? void 0 : _a.length)) {
                    levelsWithKnownCodecs.push(level);
                }
                parsed.levels.push(level);
            }
            else if (result[3]) {
                var tag = result[3];
                var attributes = result[4];
                switch (tag) {
                    case 'SESSION-DATA': {
                        // #EXT-X-SESSION-DATA
                        var sessionAttrs = new attr_list_1.AttrList(attributes);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, sessionAttrs, [
                                'DATA-ID',
                                'LANGUAGE',
                                'VALUE',
                                'URI',
                            ]);
                        }
                        var dataId = sessionAttrs['DATA-ID'];
                        if (dataId) {
                            if (parsed.sessionData === null) {
                                parsed.sessionData = {};
                            }
                            parsed.sessionData[dataId] = sessionAttrs;
                        }
                        break;
                    }
                    case 'SESSION-KEY': {
                        // #EXT-X-SESSION-KEY
                        var sessionKey = parseKey(attributes, baseurl, parsed);
                        if (sessionKey.encrypted && sessionKey.isSupported()) {
                            if (parsed.sessionKeys === null) {
                                parsed.sessionKeys = [];
                            }
                            parsed.sessionKeys.push(sessionKey);
                        }
                        else {
                            logger_1.logger.warn("[Keys] Ignoring invalid EXT-X-SESSION-KEY tag: \"".concat(attributes, "\""));
                        }
                        break;
                    }
                    case 'DEFINE': {
                        // #EXT-X-DEFINE
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            var variableAttributes = new attr_list_1.AttrList(attributes);
                            (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, variableAttributes, [
                                'NAME',
                                'VALUE',
                                'QUERYPARAM',
                            ]);
                            (0, variable_substitution_1.addVariableDefinition)(parsed, variableAttributes, baseurl);
                        }
                        break;
                    }
                    case 'CONTENT-STEERING': {
                        // #EXT-X-CONTENT-STEERING
                        var contentSteeringAttributes = new attr_list_1.AttrList(attributes);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, contentSteeringAttributes, ['SERVER-URI', 'PATHWAY-ID']);
                        }
                        parsed.contentSteering = {
                            uri: M3U8Parser.resolve(contentSteeringAttributes['SERVER-URI'], baseurl),
                            pathwayId: contentSteeringAttributes['PATHWAY-ID'] || '.',
                        };
                        break;
                    }
                    case 'START': {
                        // #EXT-X-START
                        parsed.startTimeOffset = parseStartTimeOffset(attributes);
                        break;
                    }
                    default:
                        break;
                }
            }
        }
        // Filter out levels with unknown codecs if it does not remove all levels
        var stripUnknownCodecLevels = levelsWithKnownCodecs.length > 0 &&
            levelsWithKnownCodecs.length < parsed.levels.length;
        parsed.levels = stripUnknownCodecLevels
            ? levelsWithKnownCodecs
            : parsed.levels;
        if (parsed.levels.length === 0) {
            parsed.playlistParsingError = new Error('no levels found in manifest');
        }
        return parsed;
    };
    M3U8Parser.parseMasterPlaylistMedia = function (string, baseurl, parsed) {
        var result;
        var results = {};
        var levels = parsed.levels;
        var groupsByType = {
            AUDIO: levels.map(function (level) { return ({
                id: level.attrs.AUDIO,
                audioCodec: level.audioCodec,
            }); }),
            SUBTITLES: levels.map(function (level) { return ({
                id: level.attrs.SUBTITLES,
                textCodec: level.textCodec,
            }); }),
            'CLOSED-CAPTIONS': [],
        };
        var id = 0;
        MASTER_PLAYLIST_MEDIA_REGEX.lastIndex = 0;
        while ((result = MASTER_PLAYLIST_MEDIA_REGEX.exec(string)) !== null) {
            var attrs = new attr_list_1.AttrList(result[1]);
            var type = attrs.TYPE;
            if (type) {
                var groups = groupsByType[type];
                var medias = results[type] || [];
                results[type] = medias;
                if (__USE_VARIABLE_SUBSTITUTION__) {
                    (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, attrs, [
                        'URI',
                        'GROUP-ID',
                        'LANGUAGE',
                        'ASSOC-LANGUAGE',
                        'STABLE-RENDITION-ID',
                        'NAME',
                        'INSTREAM-ID',
                        'CHARACTERISTICS',
                        'CHANNELS',
                    ]);
                }
                var lang = attrs.LANGUAGE;
                var assocLang = attrs['ASSOC-LANGUAGE'];
                var channels = attrs.CHANNELS;
                var characteristics = attrs.CHARACTERISTICS;
                var instreamId = attrs['INSTREAM-ID'];
                var media = {
                    attrs: attrs,
                    bitrate: 0,
                    id: id++,
                    groupId: attrs['GROUP-ID'] || '',
                    name: attrs.NAME || lang || '',
                    type: type,
                    default: attrs.bool('DEFAULT'),
                    autoselect: attrs.bool('AUTOSELECT'),
                    forced: attrs.bool('FORCED'),
                    lang: lang,
                    url: attrs.URI ? M3U8Parser.resolve(attrs.URI, baseurl) : '',
                };
                if (assocLang) {
                    media.assocLang = assocLang;
                }
                if (channels) {
                    media.channels = channels;
                }
                if (characteristics) {
                    media.characteristics = characteristics;
                }
                if (instreamId) {
                    media.instreamId = instreamId;
                }
                if (groups === null || groups === void 0 ? void 0 : groups.length) {
                    // If there are audio or text groups signalled in the manifest, let's look for a matching codec string for this track
                    // If we don't find the track signalled, lets use the first audio groups codec we have
                    // Acting as a best guess
                    var groupCodec = M3U8Parser.findGroup(groups, media.groupId) || groups[0];
                    assignCodec(media, groupCodec, 'audioCodec');
                    assignCodec(media, groupCodec, 'textCodec');
                }
                medias.push(media);
            }
        }
        return results;
    };
    M3U8Parser.parseLevelPlaylist = function (string, baseurl, id, type, levelUrlId, multivariantVariableList) {
        var level = new level_details_1.LevelDetails(baseurl);
        var fragments = level.fragments;
        // The most recent init segment seen (applies to all subsequent segments)
        var currentInitSegment = null;
        var currentSN = 0;
        var currentPart = 0;
        var totalduration = 0;
        var discontinuityCounter = 0;
        var prevFrag = null;
        var frag = new fragment_1.Fragment(type, baseurl);
        var result;
        var i;
        var levelkeys;
        var firstPdtIndex = -1;
        var createNextFrag = false;
        var nextByteRange = null;
        LEVEL_PLAYLIST_REGEX_FAST.lastIndex = 0;
        level.m3u8 = string;
        level.hasVariableRefs = __USE_VARIABLE_SUBSTITUTION__
            ? (0, variable_substitution_1.hasVariableReferences)(string)
            : false;
        while ((result = LEVEL_PLAYLIST_REGEX_FAST.exec(string)) !== null) {
            if (createNextFrag) {
                createNextFrag = false;
                frag = new fragment_1.Fragment(type, baseurl);
                // setup the next fragment for part loading
                frag.start = totalduration;
                frag.sn = currentSN;
                frag.cc = discontinuityCounter;
                frag.level = id;
                if (currentInitSegment) {
                    frag.initSegment = currentInitSegment;
                    frag.rawProgramDateTime = currentInitSegment.rawProgramDateTime;
                    currentInitSegment.rawProgramDateTime = null;
                    if (nextByteRange) {
                        frag.setByteRange(nextByteRange);
                        nextByteRange = null;
                    }
                }
            }
            var duration = result[1];
            if (duration) {
                // INF
                frag.duration = parseFloat(duration);
                // avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
                var title = (' ' + result[2]).slice(1);
                frag.title = title || null;
                frag.tagList.push(title ? ['INF', duration, title] : ['INF', duration]);
            }
            else if (result[3]) {
                // url
                if (Number.isFinite(frag.duration)) {
                    frag.start = totalduration;
                    if (levelkeys) {
                        setFragLevelKeys(frag, levelkeys, level);
                    }
                    frag.sn = currentSN;
                    frag.level = id;
                    frag.cc = discontinuityCounter;
                    fragments.push(frag);
                    // avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
                    var uri = (' ' + result[3]).slice(1);
                    frag.relurl = __USE_VARIABLE_SUBSTITUTION__
                        ? (0, variable_substitution_1.substituteVariables)(level, uri)
                        : uri;
                    assignProgramDateTime(frag, prevFrag);
                    prevFrag = frag;
                    totalduration += frag.duration;
                    currentSN++;
                    currentPart = 0;
                    createNextFrag = true;
                }
            }
            else if (result[4]) {
                // X-BYTERANGE
                var data = (' ' + result[4]).slice(1);
                if (prevFrag) {
                    frag.setByteRange(data, prevFrag);
                }
                else {
                    frag.setByteRange(data);
                }
            }
            else if (result[5]) {
                // PROGRAM-DATE-TIME
                // avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
                frag.rawProgramDateTime = (' ' + result[5]).slice(1);
                frag.tagList.push(['PROGRAM-DATE-TIME', frag.rawProgramDateTime]);
                if (firstPdtIndex === -1) {
                    firstPdtIndex = fragments.length;
                }
            }
            else {
                result = result[0].match(LEVEL_PLAYLIST_REGEX_SLOW);
                if (!result) {
                    logger_1.logger.warn('No matches on slow regex match for level playlist!');
                    continue;
                }
                for (i = 1; i < result.length; i++) {
                    if (typeof result[i] !== 'undefined') {
                        break;
                    }
                }
                // avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
                var tag = (' ' + result[i]).slice(1);
                var value1 = (' ' + result[i + 1]).slice(1);
                var value2 = result[i + 2] ? (' ' + result[i + 2]).slice(1) : '';
                switch (tag) {
                    case 'PLAYLIST-TYPE':
                        level.type = value1.toUpperCase();
                        break;
                    case 'MEDIA-SEQUENCE':
                        currentSN = level.startSN = parseInt(value1);
                        break;
                    case 'SKIP': {
                        var skipAttrs = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, skipAttrs, [
                                'RECENTLY-REMOVED-DATERANGES',
                            ]);
                        }
                        var skippedSegments = skipAttrs.decimalInteger('SKIPPED-SEGMENTS');
                        if (Number.isFinite(skippedSegments)) {
                            level.skippedSegments = skippedSegments;
                            // This will result in fragments[] containing undefined values, which we will fill in with `mergeDetails`
                            for (var i_1 = skippedSegments; i_1--;) {
                                fragments.unshift(null);
                            }
                            currentSN += skippedSegments;
                        }
                        var recentlyRemovedDateranges = skipAttrs.enumeratedString('RECENTLY-REMOVED-DATERANGES');
                        if (recentlyRemovedDateranges) {
                            level.recentlyRemovedDateranges =
                                recentlyRemovedDateranges.split('\t');
                        }
                        break;
                    }
                    case 'TARGETDURATION':
                        level.targetduration = Math.max(parseInt(value1), 1);
                        break;
                    case 'VERSION':
                        level.version = parseInt(value1);
                        break;
                    case 'INDEPENDENT-SEGMENTS':
                    case 'EXTM3U':
                        break;
                    case 'ENDLIST':
                        level.live = false;
                        break;
                    case '#':
                        if (value1 || value2) {
                            frag.tagList.push(value2 ? [value1, value2] : [value1]);
                        }
                        break;
                    case 'DISCONTINUITY':
                        discontinuityCounter++;
                        frag.tagList.push(['DIS']);
                        break;
                    case 'GAP':
                        frag.gap = true;
                        frag.tagList.push([tag]);
                        break;
                    case 'BITRATE':
                        frag.tagList.push([tag, value1]);
                        break;
                    case 'DATERANGE': {
                        var dateRangeAttr = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, dateRangeAttr, [
                                'ID',
                                'CLASS',
                                'START-DATE',
                                'END-DATE',
                                'SCTE35-CMD',
                                'SCTE35-OUT',
                                'SCTE35-IN',
                            ]);
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, dateRangeAttr, dateRangeAttr.clientAttrs);
                        }
                        var dateRange = new date_range_1.DateRange(dateRangeAttr, level.dateRanges[dateRangeAttr.ID]);
                        if (dateRange.isValid || level.skippedSegments) {
                            level.dateRanges[dateRange.id] = dateRange;
                        }
                        else {
                            logger_1.logger.warn("Ignoring invalid DATERANGE tag: \"".concat(value1, "\""));
                        }
                        // Add to fragment tag list for backwards compatibility (< v1.2.0)
                        frag.tagList.push(['EXT-X-DATERANGE', value1]);
                        break;
                    }
                    case 'DEFINE': {
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            var variableAttributes = new attr_list_1.AttrList(value1);
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, variableAttributes, [
                                'NAME',
                                'VALUE',
                                'IMPORT',
                                'QUERYPARAM',
                            ]);
                            if ('IMPORT' in variableAttributes) {
                                (0, variable_substitution_1.importVariableDefinition)(level, variableAttributes, multivariantVariableList);
                            }
                            else {
                                (0, variable_substitution_1.addVariableDefinition)(level, variableAttributes, baseurl);
                            }
                        }
                        break;
                    }
                    case 'DISCONTINUITY-SEQUENCE':
                        discontinuityCounter = parseInt(value1);
                        break;
                    case 'KEY': {
                        var levelKey = parseKey(value1, baseurl, level);
                        if (levelKey.isSupported()) {
                            if (levelKey.method === 'NONE') {
                                levelkeys = undefined;
                                break;
                            }
                            if (!levelkeys) {
                                levelkeys = {};
                            }
                            if (levelkeys[levelKey.keyFormat]) {
                                levelkeys = Object.assign({}, levelkeys);
                            }
                            levelkeys[levelKey.keyFormat] = levelKey;
                        }
                        else {
                            logger_1.logger.warn("[Keys] Ignoring invalid EXT-X-KEY tag: \"".concat(value1, "\""));
                        }
                        break;
                    }
                    case 'START':
                        level.startTimeOffset = parseStartTimeOffset(value1);
                        break;
                    case 'MAP': {
                        var mapAttrs = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, mapAttrs, [
                                'BYTERANGE',
                                'URI',
                            ]);
                        }
                        if (frag.duration) {
                            // Initial segment tag is after segment duration tag.
                            //   #EXTINF: 6.0
                            //   #EXT-X-MAP:URI="init.mp4
                            var init = new fragment_1.Fragment(type, baseurl);
                            setInitSegment(init, mapAttrs, id, levelkeys);
                            currentInitSegment = init;
                            frag.initSegment = currentInitSegment;
                            if (currentInitSegment.rawProgramDateTime &&
                                !frag.rawProgramDateTime) {
                                frag.rawProgramDateTime = currentInitSegment.rawProgramDateTime;
                            }
                        }
                        else {
                            // Initial segment tag is before segment duration tag
                            // Handle case where EXT-X-MAP is declared after EXT-X-BYTERANGE
                            var end = frag.byteRangeEndOffset;
                            if (end) {
                                var start = frag.byteRangeStartOffset;
                                nextByteRange = "".concat(end - start, "@").concat(start);
                            }
                            else {
                                nextByteRange = null;
                            }
                            setInitSegment(frag, mapAttrs, id, levelkeys);
                            currentInitSegment = frag;
                            createNextFrag = true;
                        }
                        break;
                    }
                    case 'SERVER-CONTROL': {
                        var serverControlAttrs = new attr_list_1.AttrList(value1);
                        level.canBlockReload = serverControlAttrs.bool('CAN-BLOCK-RELOAD');
                        level.canSkipUntil = serverControlAttrs.optionalFloat('CAN-SKIP-UNTIL', 0);
                        level.canSkipDateRanges =
                            level.canSkipUntil > 0 &&
                                serverControlAttrs.bool('CAN-SKIP-DATERANGES');
                        level.partHoldBack = serverControlAttrs.optionalFloat('PART-HOLD-BACK', 0);
                        level.holdBack = serverControlAttrs.optionalFloat('HOLD-BACK', 0);
                        break;
                    }
                    case 'PART-INF': {
                        var partInfAttrs = new attr_list_1.AttrList(value1);
                        level.partTarget = partInfAttrs.decimalFloatingPoint('PART-TARGET');
                        break;
                    }
                    case 'PART': {
                        var partList = level.partList;
                        if (!partList) {
                            partList = level.partList = [];
                        }
                        var previousFragmentPart = currentPart > 0 ? partList[partList.length - 1] : undefined;
                        var index = currentPart++;
                        var partAttrs = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, partAttrs, [
                                'BYTERANGE',
                                'URI',
                            ]);
                        }
                        var part = new fragment_1.Part(partAttrs, frag, baseurl, index, previousFragmentPart);
                        partList.push(part);
                        frag.duration += part.duration;
                        break;
                    }
                    case 'PRELOAD-HINT': {
                        var preloadHintAttrs = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, preloadHintAttrs, ['URI']);
                        }
                        level.preloadHint = preloadHintAttrs;
                        break;
                    }
                    case 'RENDITION-REPORT': {
                        var renditionReportAttrs = new attr_list_1.AttrList(value1);
                        if (__USE_VARIABLE_SUBSTITUTION__) {
                            (0, variable_substitution_1.substituteVariablesInAttributes)(level, renditionReportAttrs, [
                                'URI',
                            ]);
                        }
                        level.renditionReports = level.renditionReports || [];
                        level.renditionReports.push(renditionReportAttrs);
                        break;
                    }
                    default:
                        logger_1.logger.warn("line parsed but not handled: ".concat(result));
                        break;
                }
            }
        }
        if (prevFrag && !prevFrag.relurl) {
            fragments.pop();
            totalduration -= prevFrag.duration;
            if (level.partList) {
                level.fragmentHint = prevFrag;
            }
        }
        else if (level.partList) {
            assignProgramDateTime(frag, prevFrag);
            frag.cc = discontinuityCounter;
            level.fragmentHint = frag;
            if (levelkeys) {
                setFragLevelKeys(frag, levelkeys, level);
            }
        }
        var fragmentLength = fragments.length;
        var firstFragment = fragments[0];
        var lastFragment = fragments[fragmentLength - 1];
        totalduration += level.skippedSegments * level.targetduration;
        if (totalduration > 0 && fragmentLength && lastFragment) {
            level.averagetargetduration = totalduration / fragmentLength;
            var lastSn = lastFragment.sn;
            level.endSN = lastSn !== 'initSegment' ? lastSn : 0;
            if (!level.live) {
                lastFragment.endList = true;
            }
            if (firstFragment) {
                level.startCC = firstFragment.cc;
            }
        }
        else {
            level.endSN = 0;
            level.startCC = 0;
        }
        if (level.fragmentHint) {
            totalduration += level.fragmentHint.duration;
        }
        level.totalduration = totalduration;
        level.endCC = discontinuityCounter;
        /**
         * Backfill any missing PDT values
         * "If the first EXT-X-PROGRAM-DATE-TIME tag in a Playlist appears after
         * one or more Media Segment URIs, the client SHOULD extrapolate
         * backward from that tag (using EXTINF durations and/or media
         * timestamps) to associate dates with those segments."
         * We have already extrapolated forward, but all fragments up to the first instance of PDT do not have their PDTs
         * computed.
         */
        if (firstPdtIndex > 0) {
            backfillProgramDateTimes(fragments, firstPdtIndex);
        }
        return level;
    };
    return M3U8Parser;
}());
exports.default = M3U8Parser;
function parseKey(keyTagAttributes, baseurl, parsed) {
    var _a, _b;
    // https://tools.ietf.org/html/rfc8216#section-4.3.2.4
    var keyAttrs = new attr_list_1.AttrList(keyTagAttributes);
    if (__USE_VARIABLE_SUBSTITUTION__) {
        (0, variable_substitution_1.substituteVariablesInAttributes)(parsed, keyAttrs, [
            'KEYFORMAT',
            'KEYFORMATVERSIONS',
            'URI',
            'IV',
            'URI',
        ]);
    }
    var decryptmethod = (_a = keyAttrs.METHOD) !== null && _a !== void 0 ? _a : '';
    var decrypturi = keyAttrs.URI;
    var decryptiv = keyAttrs.hexadecimalInteger('IV');
    var decryptkeyformatversions = keyAttrs.KEYFORMATVERSIONS;
    // From RFC: This attribute is OPTIONAL; its absence indicates an implicit value of "identity".
    var decryptkeyformat = (_b = keyAttrs.KEYFORMAT) !== null && _b !== void 0 ? _b : 'identity';
    if (decrypturi && keyAttrs.IV && !decryptiv) {
        logger_1.logger.error("Invalid IV: ".concat(keyAttrs.IV));
    }
    // If decrypturi is a URI with a scheme, then baseurl will be ignored
    // No uri is allowed when METHOD is NONE
    var resolvedUri = decrypturi ? M3U8Parser.resolve(decrypturi, baseurl) : '';
    var keyFormatVersions = (decryptkeyformatversions ? decryptkeyformatversions : '1')
        .split('/')
        .map(Number)
        .filter(Number.isFinite);
    return new level_key_1.LevelKey(decryptmethod, resolvedUri, decryptkeyformat, keyFormatVersions, decryptiv);
}
function parseStartTimeOffset(startAttributes) {
    var startAttrs = new attr_list_1.AttrList(startAttributes);
    var startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
    if (Number.isFinite(startTimeOffset)) {
        return startTimeOffset;
    }
    return null;
}
function setCodecs(codecsAttributeValue, level) {
    var codecs = (codecsAttributeValue || '').split(/[ ,]+/).filter(function (c) { return c; });
    ['video', 'audio', 'text'].forEach(function (type) {
        var filtered = codecs.filter(function (codec) { return (0, codecs_1.isCodecType)(codec, type); });
        if (filtered.length) {
            // Comma separated list of all codecs for type
            level["".concat(type, "Codec")] = filtered.join(',');
            // Remove known codecs so that only unknownCodecs are left after iterating through each type
            codecs = codecs.filter(function (codec) { return filtered.indexOf(codec) === -1; });
        }
    });
    level.unknownCodecs = codecs;
}
function assignCodec(media, groupItem, codecProperty) {
    var codecValue = groupItem[codecProperty];
    if (codecValue) {
        media[codecProperty] = codecValue;
    }
}
function backfillProgramDateTimes(fragments, firstPdtIndex) {
    var fragPrev = fragments[firstPdtIndex];
    for (var i = firstPdtIndex; i--;) {
        var frag = fragments[i];
        // Exit on delta-playlist skipped segments
        if (!frag) {
            return;
        }
        frag.programDateTime =
            fragPrev.programDateTime - frag.duration * 1000;
        fragPrev = frag;
    }
}
function assignProgramDateTime(frag, prevFrag) {
    if (frag.rawProgramDateTime) {
        frag.programDateTime = Date.parse(frag.rawProgramDateTime);
    }
    else if (prevFrag === null || prevFrag === void 0 ? void 0 : prevFrag.programDateTime) {
        frag.programDateTime = prevFrag.endProgramDateTime;
    }
    if (!Number.isFinite(frag.programDateTime)) {
        frag.programDateTime = null;
        frag.rawProgramDateTime = null;
    }
}
function setInitSegment(frag, mapAttrs, id, levelkeys) {
    frag.relurl = mapAttrs.URI;
    if (mapAttrs.BYTERANGE) {
        frag.setByteRange(mapAttrs.BYTERANGE);
    }
    frag.level = id;
    frag.sn = 'initSegment';
    if (levelkeys) {
        frag.levelkeys = levelkeys;
    }
    frag.initSegment = null;
}
function setFragLevelKeys(frag, levelkeys, level) {
    frag.levelkeys = levelkeys;
    var encryptedFragments = level.encryptedFragments;
    if ((!encryptedFragments.length ||
        encryptedFragments[encryptedFragments.length - 1].levelkeys !==
            levelkeys) &&
        Object.keys(levelkeys).some(function (format) { return levelkeys[format].isCommonEncryption; })) {
        encryptedFragments.push(frag);
    }
}
