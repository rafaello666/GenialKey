"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectable = connectable;
var Subject_1 = require("../Subject");
var Observable_1 = require("../Observable");
var defer_1 = require("./defer");
/**
 * The default configuration for `connectable`.
 */
var DEFAULT_CONFIG = {
    connector: function () { return new Subject_1.Subject(); },
    resetOnDisconnect: true,
};
/**
 * Creates an observable that multicasts once `connect()` is called on it.
 *
 * @param source The observable source to make connectable.
 * @param config The configuration object for `connectable`.
 * @returns A "connectable" observable, that has a `connect()` method, that you must call to
 * connect the source to all consumers through the subject provided as the connector.
 */
function connectable(source, config) {
    if (config === void 0) { config = DEFAULT_CONFIG; }
    // The subscription representing the connection.
    var connection = null;
    var connector = config.connector, _a = config.resetOnDisconnect, resetOnDisconnect = _a === void 0 ? true : _a;
    var subject = connector();
    var result = new Observable_1.Observable(function (subscriber) {
        return subject.subscribe(subscriber);
    });
    // Define the `connect` function. This is what users must call
    // in order to "connect" the source to the subject that is
    // multicasting it.
    result.connect = function () {
        if (!connection || connection.closed) {
            connection = (0, defer_1.defer)(function () { return source; }).subscribe(subject);
            if (resetOnDisconnect) {
                connection.add(function () { return (subject = connector()); });
            }
        }
        return connection;
    };
    return result;
}
