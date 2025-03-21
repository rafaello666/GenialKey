"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXHRResponse = getXHRResponse;
/**
 * Gets what should be in the `response` property of the XHR. However,
 * since we still support the final versions of IE, we need to do a little
 * checking here to make sure that we get the right thing back. Consequently,
 * we need to do a JSON.parse() in here, which *could* throw if the response
 * isn't valid JSON.
 *
 * This is used both in creating an AjaxResponse, and in creating certain errors
 * that we throw, so we can give the user whatever was in the response property.
 *
 * @param xhr The XHR to examine the response of
 */
function getXHRResponse(xhr) {
    switch (xhr.responseType) {
        case 'json': {
            if ('response' in xhr) {
                return xhr.response;
            }
            else {
                // IE
                var ieXHR = xhr;
                return JSON.parse(ieXHR.responseText);
            }
        }
        case 'document':
            return xhr.responseXML;
        case 'text':
        default: {
            if ('response' in xhr) {
                return xhr.response;
            }
            else {
                // IE
                var ieXHR = xhr;
                return ieXHR.responseText;
            }
        }
    }
}
