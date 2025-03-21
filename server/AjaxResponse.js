"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AjaxResponse = void 0;
var getXHRResponse_1 = require("./getXHRResponse");
/**
 * A normalized response from an AJAX request. To get the data from the response,
 * you will want to read the `response` property.
 *
 * - DO NOT create instances of this class directly.
 * - DO NOT subclass this class.
 *
 * It is advised not to hold this object in memory, as it has a reference to
 * the original XHR used to make the request, as well as properties containing
 * request and response data.
 *
 * @see {@link ajax}
 * @see {@link AjaxConfig}
 */
var AjaxResponse = /** @class */ (function () {
    /**
     * A normalized response from an AJAX request. To get the data from the response,
     * you will want to read the `response` property.
     *
     * - DO NOT create instances of this class directly.
     * - DO NOT subclass this class.
     *
     * @param originalEvent The original event object from the XHR `onload` event.
     * @param xhr The `XMLHttpRequest` object used to make the request. This is useful for examining status code, etc.
     * @param request The request settings used to make the HTTP request.
     * @param type The type of the event emitted by the {@link ajax} Observable
     */
    function AjaxResponse(
    /**
     * The original event object from the raw XHR event.
     */
    originalEvent, 
    /**
     * The XMLHttpRequest object used to make the request.
     * NOTE: It is advised not to hold this in memory, as it will retain references to all of it's event handlers
     * and many other things related to the request.
     */
    xhr, 
    /**
     * The request parameters used to make the HTTP request.
     */
    request, 
    /**
     * The event type. This can be used to discern between different events
     * if you're using progress events with {@link includeDownloadProgress} or
     * {@link includeUploadProgress} settings in {@link AjaxConfig}.
     *
     * The event type consists of two parts: the {@link AjaxDirection} and the
     * the event type. Merged with `_`, they form the `type` string. The
     * direction can be an `upload` or a `download` direction, while an event can
     * be `loadstart`, `progress` or `load`.
     *
     * `download_load` is the type of event when download has finished and the
     * response is available.
     */
    type) {
        if (type === void 0) { type = 'download_load'; }
        this.originalEvent = originalEvent;
        this.xhr = xhr;
        this.request = request;
        this.type = type;
        var status = xhr.status, responseType = xhr.responseType;
        this.status = status !== null && status !== void 0 ? status : 0;
        this.responseType = responseType !== null && responseType !== void 0 ? responseType : '';
        // Parse the response headers in advance for the user. There's really
        // not a great way to get all of them. So we need to parse the header string
        // we get back. It comes in a simple enough format:
        //
        // header-name: value here
        // content-type: application/json
        // other-header-here: some, other, values, or, whatever
        var allHeaders = xhr.getAllResponseHeaders();
        this.responseHeaders = allHeaders
            ? // Split the header text into lines
                allHeaders.split('\n').reduce(function (headers, line) {
                    // Split the lines on the first ": " as
                    // "key: value". Note that the value could
                    // technically have a ": " in it.
                    var index = line.indexOf(': ');
                    headers[line.slice(0, index)] = line.slice(index + 2);
                    return headers;
                }, {})
            : {};
        this.response = (0, getXHRResponse_1.getXHRResponse)(xhr);
        var loaded = originalEvent.loaded, total = originalEvent.total;
        this.loaded = loaded;
        this.total = total;
    }
    return AjaxResponse;
}());
exports.AjaxResponse = AjaxResponse;
