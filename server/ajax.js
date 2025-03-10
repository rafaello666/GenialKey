"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ajax = void 0;
exports.fromAjax = fromAjax;
var map_1 = require("../operators/map");
var Observable_1 = require("../Observable");
var AjaxResponse_1 = require("./AjaxResponse");
var errors_1 = require("./errors");
function ajaxGet(url, headers) {
    return (0, exports.ajax)({ method: 'GET', url: url, headers: headers });
}
function ajaxPost(url, body, headers) {
    return (0, exports.ajax)({ method: 'POST', url: url, body: body, headers: headers });
}
function ajaxDelete(url, headers) {
    return (0, exports.ajax)({ method: 'DELETE', url: url, headers: headers });
}
function ajaxPut(url, body, headers) {
    return (0, exports.ajax)({ method: 'PUT', url: url, body: body, headers: headers });
}
function ajaxPatch(url, body, headers) {
    return (0, exports.ajax)({ method: 'PATCH', url: url, body: body, headers: headers });
}
var mapResponse = (0, map_1.map)(function (x) { return x.response; });
function ajaxGetJSON(url, headers) {
    return mapResponse((0, exports.ajax)({
        method: 'GET',
        url: url,
        headers: headers,
    }));
}
/**
 * There is an ajax operator on the Rx object.
 *
 * It creates an observable for an Ajax request with either a request object with
 * url, headers, etc or a string for a URL.
 *
 * ## Examples
 *
 * Using `ajax()` to fetch the response object that is being returned from API
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax('https://api.github.com/users?per_page=5').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax.getJSON()` to fetch data from API
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax.getJSON('https://api.github.com/users?per_page=5').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax()` with object as argument and method POST with a two seconds delay
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const users = ajax({
 *   url: 'https://httpbin.org/delay/2',
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'rxjs-custom-header': 'Rxjs'
 *   },
 *   body: {
 *     rxjs: 'Hello World!'
 *   }
 * }).pipe(
 *   map(response => console.log('response: ', response)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * users.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax()` to fetch. An error object that is being returned from the request
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax('https://api.github.com/404').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 */
exports.ajax = (function () {
    var create = function (urlOrConfig) {
        var config = typeof urlOrConfig === 'string'
            ? {
                url: urlOrConfig,
            }
            : urlOrConfig;
        return fromAjax(config);
    };
    create.get = ajaxGet;
    create.post = ajaxPost;
    create.delete = ajaxDelete;
    create.put = ajaxPut;
    create.patch = ajaxPatch;
    create.getJSON = ajaxGetJSON;
    return create;
})();
var UPLOAD = 'upload';
var DOWNLOAD = 'download';
var LOADSTART = 'loadstart';
var PROGRESS = 'progress';
var LOAD = 'load';
function fromAjax(init) {
    return new Observable_1.Observable(function (destination) {
        var _a, _b;
        var config = __assign({ 
            // Defaults
            async: true, crossDomain: false, withCredentials: false, method: 'GET', timeout: 0, responseType: 'json' }, init);
        var queryParams = config.queryParams, configuredBody = config.body, configuredHeaders = config.headers;
        var url = config.url;
        if (!url) {
            throw new TypeError('url is required');
        }
        if (queryParams) {
            var searchParams_1;
            if (url.includes('?')) {
                // If the user has passed a URL with a querystring already in it,
                // we need to combine them. So we're going to split it. There
                // should only be one `?` in a valid URL.
                var parts = url.split('?');
                if (2 < parts.length) {
                    throw new TypeError('invalid url');
                }
                // Add the passed queryParams to the params already in the url provided.
                searchParams_1 = new URLSearchParams(parts[1]);
                // queryParams is converted to any because the runtime is *much* more permissive than
                // the types are.
                new URLSearchParams(queryParams).forEach(function (value, key) { return searchParams_1.set(key, value); });
                // We have to do string concatenation here, because `new URL(url)` does
                // not like relative URLs like `/this` without a base url, which we can't
                // specify, nor can we assume `location` will exist, because of node.
                url = parts[0] + '?' + searchParams_1;
            }
            else {
                // There is no preexisting querystring, so we can just use URLSearchParams
                // to convert the passed queryParams into the proper format and encodings.
                // queryParams is converted to any because the runtime is *much* more permissive than
                // the types are.
                searchParams_1 = new URLSearchParams(queryParams);
                url = url + '?' + searchParams_1;
            }
        }
        // Normalize the headers. We're going to make them all lowercase, since
        // Headers are case insensitive by design. This makes it easier to verify
        // that we aren't setting or sending duplicates.
        var headers = {};
        if (configuredHeaders) {
            for (var key in configuredHeaders) {
                if (configuredHeaders.hasOwnProperty(key)) {
                    headers[key.toLowerCase()] = configuredHeaders[key];
                }
            }
        }
        var crossDomain = config.crossDomain;
        // Set the x-requested-with header. This is a non-standard header that has
        // come to be a de facto standard for HTTP requests sent by libraries and frameworks
        // using XHR. However, we DO NOT want to set this if it is a CORS request. This is
        // because sometimes this header can cause issues with CORS. To be clear,
        // None of this is necessary, it's only being set because it's "the thing libraries do"
        // Starting back as far as JQuery, and continuing with other libraries such as Angular 1,
        // Axios, et al.
        if (!crossDomain && !('x-requested-with' in headers)) {
            headers['x-requested-with'] = 'XMLHttpRequest';
        }
        // Allow users to provide their XSRF cookie name and the name of a custom header to use to
        // send the cookie.
        var withCredentials = config.withCredentials, xsrfCookieName = config.xsrfCookieName, xsrfHeaderName = config.xsrfHeaderName;
        if ((withCredentials || !crossDomain) && xsrfCookieName && xsrfHeaderName) {
            var xsrfCookie = (_b = (_a = document === null || document === void 0 ? void 0 : document.cookie.match(new RegExp("(^|;\\s*)(".concat(xsrfCookieName, ")=([^;]*)")))) === null || _a === void 0 ? void 0 : _a.pop()) !== null && _b !== void 0 ? _b : '';
            if (xsrfCookie) {
                headers[xsrfHeaderName] = xsrfCookie;
            }
        }
        // Examine the body and determine whether or not to serialize it
        // and set the content-type in `headers`, if we're able.
        var body = extractContentTypeAndMaybeSerializeBody(configuredBody, headers);
        // The final request settings.
        var _request = __assign(__assign({}, config), { 
            // Set values we ensured above
            url: url, headers: headers, body: body });
        var xhr;
        // Create our XHR so we can get started.
        xhr = init.createXHR ? init.createXHR() : new XMLHttpRequest();
        {
            ///////////////////////////////////////////////////
            // set up the events before open XHR
            // https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
            // You need to add the event listeners before calling open() on the request.
            // Otherwise the progress events will not fire.
            ///////////////////////////////////////////////////
            var progressSubscriber_1 = init.progressSubscriber, _c = init.includeDownloadProgress, includeDownloadProgress = _c === void 0 ? false : _c, _d = init.includeUploadProgress, includeUploadProgress = _d === void 0 ? false : _d;
            /**
             * Wires up an event handler that will emit an error when fired. Used
             * for timeout and abort events.
             * @param type The type of event we're treating as an error
             * @param errorFactory A function that creates the type of error to emit.
             */
            var addErrorEvent = function (type, errorFactory) {
                xhr.addEventListener(type, function () {
                    var _a;
                    var error = errorFactory();
                    (_a = progressSubscriber_1 === null || progressSubscriber_1 === void 0 ? void 0 : progressSubscriber_1.error) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber_1, error);
                    destination.error(error);
                });
            };
            // If the request times out, handle errors appropriately.
            addErrorEvent('timeout', function () { return new errors_1.AjaxTimeoutError(xhr, _request); });
            // If the request aborts (due to a network disconnection or the like), handle
            // it as an error.
            addErrorEvent('abort', function () { return new errors_1.AjaxError('aborted', xhr, _request); });
            /**
             * Creates a response object to emit to the consumer.
             * @param direction the direction related to the event. Prefixes the event `type` in the
             * `AjaxResponse` object with "upload_" for events related to uploading and "download_"
             * for events related to downloading.
             * @param event the actual event object.
             */
            var createResponse_1 = function (direction, event) {
                return new AjaxResponse_1.AjaxResponse(event, xhr, _request, "".concat(direction, "_").concat(event.type));
            };
            /**
             * Wires up an event handler that emits a Response object to the consumer, used for
             * all events that emit responses, loadstart, progress, and load.
             * Note that download load handling is a bit different below, because it has
             * more logic it needs to run.
             * @param target The target, either the XHR itself or the Upload object.
             * @param type The type of event to wire up
             * @param direction The "direction", used to prefix the response object that is
             * emitted to the consumer. (e.g. "upload_" or "download_")
             */
            var addProgressEvent_1 = function (target, type, direction) {
                target.addEventListener(type, function (event) {
                    destination.next(createResponse_1(direction, event));
                });
            };
            if (includeUploadProgress) {
                [LOADSTART, PROGRESS, LOAD].forEach(function (type) { return addProgressEvent_1(xhr.upload, type, UPLOAD); });
            }
            if (progressSubscriber_1) {
                [LOADSTART, PROGRESS].forEach(function (type) { return xhr.upload.addEventListener(type, function (e) { var _a; return (_a = progressSubscriber_1 === null || progressSubscriber_1 === void 0 ? void 0 : progressSubscriber_1.next) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber_1, e); }); });
            }
            if (includeDownloadProgress) {
                [LOADSTART, PROGRESS].forEach(function (type) { return addProgressEvent_1(xhr, type, DOWNLOAD); });
            }
            var emitError_1 = function (status) {
                var msg = 'ajax error' + (status ? ' ' + status : '');
                destination.error(new errors_1.AjaxError(msg, xhr, _request));
            };
            xhr.addEventListener('error', function (e) {
                var _a;
                (_a = progressSubscriber_1 === null || progressSubscriber_1 === void 0 ? void 0 : progressSubscriber_1.error) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber_1, e);
                emitError_1();
            });
            xhr.addEventListener(LOAD, function (event) {
                var _a, _b;
                var status = xhr.status;
                // 4xx and 5xx should error (https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)
                if (status < 400) {
                    (_a = progressSubscriber_1 === null || progressSubscriber_1 === void 0 ? void 0 : progressSubscriber_1.complete) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber_1);
                    var response = void 0;
                    try {
                        // This can throw in IE, because we end up needing to do a JSON.parse
                        // of the response in some cases to produce object we'd expect from
                        // modern browsers.
                        response = createResponse_1(DOWNLOAD, event);
                    }
                    catch (err) {
                        destination.error(err);
                        return;
                    }
                    destination.next(response);
                    destination.complete();
                }
                else {
                    (_b = progressSubscriber_1 === null || progressSubscriber_1 === void 0 ? void 0 : progressSubscriber_1.error) === null || _b === void 0 ? void 0 : _b.call(progressSubscriber_1, event);
                    emitError_1(status);
                }
            });
        }
        var user = _request.user, method = _request.method, async = _request.async;
        // open XHR
        if (user) {
            xhr.open(method, url, async, user, _request.password);
        }
        else {
            xhr.open(method, url, async);
        }
        // timeout, responseType and withCredentials can be set once the XHR is open
        if (async) {
            xhr.timeout = _request.timeout;
            xhr.responseType = _request.responseType;
        }
        if ('withCredentials' in xhr) {
            xhr.withCredentials = _request.withCredentials;
        }
        // set headers
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
        // finally send the request
        if (body) {
            xhr.send(body);
        }
        else {
            xhr.send();
        }
        return function () {
            if (xhr && xhr.readyState !== 4 /*XHR done*/) {
                xhr.abort();
            }
        };
    });
}
/**
 * Examines the body to determine if we need to serialize it for them or not.
 * If the body is a type that XHR handles natively, we just allow it through,
 * otherwise, if the body is something that *we* can serialize for the user,
 * we will serialize it, and attempt to set the `content-type` header, if it's
 * not already set.
 * @param body The body passed in by the user
 * @param headers The normalized headers
 */
function extractContentTypeAndMaybeSerializeBody(body, headers) {
    var _a;
    if (!body ||
        typeof body === 'string' ||
        isFormData(body) ||
        isURLSearchParams(body) ||
        isArrayBuffer(body) ||
        isFile(body) ||
        isBlob(body) ||
        isReadableStream(body)) {
        // The XHR instance itself can handle serializing these, and set the content-type for us
        // so we don't need to do that. https://xhr.spec.whatwg.org/#the-send()-method
        return body;
    }
    if (isArrayBufferView(body)) {
        // This is a typed array (e.g. Float32Array or Uint8Array), or a DataView.
        // XHR can handle this one too: https://fetch.spec.whatwg.org/#concept-bodyinit-extract
        return body.buffer;
    }
    if (typeof body === 'object') {
        // If we have made it here, this is an object, probably a POJO, and we'll try
        // to serialize it for them. If this doesn't work, it will throw, obviously, which
        // is okay. The workaround for users would be to manually set the body to their own
        // serialized string (accounting for circular references or whatever), then set
        // the content-type manually as well.
        headers['content-type'] = (_a = headers['content-type']) !== null && _a !== void 0 ? _a : 'application/json;charset=utf-8';
        return JSON.stringify(body);
    }
    // If we've gotten past everything above, this is something we don't quite know how to
    // handle. Throw an error. This will be caught and emitted from the observable.
    throw new TypeError('Unknown body type');
}
var _toString = Object.prototype.toString;
function toStringCheck(obj, name) {
    return _toString.call(obj) === "[object ".concat(name, "]");
}
function isArrayBuffer(body) {
    return toStringCheck(body, 'ArrayBuffer');
}
function isFile(body) {
    return toStringCheck(body, 'File');
}
function isBlob(body) {
    return toStringCheck(body, 'Blob');
}
function isArrayBufferView(body) {
    return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}
function isFormData(body) {
    return typeof FormData !== 'undefined' && body instanceof FormData;
}
function isURLSearchParams(body) {
    return typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
}
function isReadableStream(body) {
    return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
}
