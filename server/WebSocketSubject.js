"use strict";
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
exports.WebSocketSubject = void 0;
var Subject_1 = require("../../Subject");
var Subscriber_1 = require("../../Subscriber");
var Observable_1 = require("../../Observable");
var Subscription_1 = require("../../Subscription");
var ReplaySubject_1 = require("../../ReplaySubject");
var DEFAULT_WEBSOCKET_CONFIG = {
    url: '',
    deserializer: function (e) { return JSON.parse(e.data); },
    serializer: function (value) { return JSON.stringify(value); },
};
var WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT = 'WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }';
var WebSocketSubject = /** @class */ (function (_super) {
    __extends(WebSocketSubject, _super);
    function WebSocketSubject(urlConfigOrSource, destination) {
        var _this = _super.call(this) || this;
        _this._socket = null;
        if (urlConfigOrSource instanceof Observable_1.Observable) {
            _this.destination = destination;
            _this.source = urlConfigOrSource;
        }
        else {
            var config = (_this._config = __assign({}, DEFAULT_WEBSOCKET_CONFIG));
            _this._output = new Subject_1.Subject();
            if (typeof urlConfigOrSource === 'string') {
                config.url = urlConfigOrSource;
            }
            else {
                for (var key in urlConfigOrSource) {
                    if (urlConfigOrSource.hasOwnProperty(key)) {
                        config[key] = urlConfigOrSource[key];
                    }
                }
            }
            if (!config.WebSocketCtor && WebSocket) {
                config.WebSocketCtor = WebSocket;
            }
            else if (!config.WebSocketCtor) {
                throw new Error('no WebSocket constructor can be found');
            }
            _this.destination = new ReplaySubject_1.ReplaySubject();
        }
        return _this;
    }
    /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
    WebSocketSubject.prototype.lift = function (operator) {
        var sock = new WebSocketSubject(this._config, this.destination);
        sock.operator = operator;
        sock.source = this;
        return sock;
    };
    WebSocketSubject.prototype._resetState = function () {
        this._socket = null;
        if (!this.source) {
            this.destination = new ReplaySubject_1.ReplaySubject();
        }
        this._output = new Subject_1.Subject();
    };
    /**
     * Creates an {@link Observable}, that when subscribed to, sends a message,
     * defined by the `subMsg` function, to the server over the socket to begin a
     * subscription to data over that socket. Once data arrives, the
     * `messageFilter` argument will be used to select the appropriate data for
     * the resulting Observable. When finalization occurs, either due to
     * unsubscription, completion, or error, a message defined by the `unsubMsg`
     * argument will be sent to the server over the WebSocketSubject.
     *
     * @param subMsg A function to generate the subscription message to be sent to
     * the server. This will still be processed by the serializer in the
     * WebSocketSubject's config. (Which defaults to JSON serialization)
     * @param unsubMsg A function to generate the unsubscription message to be
     * sent to the server at finalization. This will still be processed by the
     * serializer in the WebSocketSubject's config.
     * @param messageFilter A predicate for selecting the appropriate messages
     * from the server for the output stream.
     */
    WebSocketSubject.prototype.multiplex = function (subMsg, unsubMsg, messageFilter) {
        var self = this;
        return new Observable_1.Observable(function (observer) {
            try {
                self.next(subMsg());
            }
            catch (err) {
                observer.error(err);
            }
            var subscription = self.subscribe({
                next: function (x) {
                    try {
                        if (messageFilter(x)) {
                            observer.next(x);
                        }
                    }
                    catch (err) {
                        observer.error(err);
                    }
                },
                error: function (err) { return observer.error(err); },
                complete: function () { return observer.complete(); },
            });
            return function () {
                try {
                    self.next(unsubMsg());
                }
                catch (err) {
                    observer.error(err);
                }
                subscription.unsubscribe();
            };
        });
    };
    WebSocketSubject.prototype._connectSocket = function () {
        var _this = this;
        var _a = this._config, WebSocketCtor = _a.WebSocketCtor, protocol = _a.protocol, url = _a.url, binaryType = _a.binaryType;
        var observer = this._output;
        var socket = null;
        try {
            socket = protocol ? new WebSocketCtor(url, protocol) : new WebSocketCtor(url);
            this._socket = socket;
            if (binaryType) {
                this._socket.binaryType = binaryType;
            }
        }
        catch (e) {
            observer.error(e);
            return;
        }
        var subscription = new Subscription_1.Subscription(function () {
            _this._socket = null;
            if (socket && socket.readyState === 1) {
                socket.close();
            }
        });
        socket.onopen = function (evt) {
            var _socket = _this._socket;
            if (!_socket) {
                socket.close();
                _this._resetState();
                return;
            }
            var openObserver = _this._config.openObserver;
            if (openObserver) {
                openObserver.next(evt);
            }
            var queue = _this.destination;
            _this.destination = Subscriber_1.Subscriber.create(function (x) {
                if (socket.readyState === 1) {
                    try {
                        var serializer = _this._config.serializer;
                        socket.send(serializer(x));
                    }
                    catch (e) {
                        _this.destination.error(e);
                    }
                }
            }, function (err) {
                var closingObserver = _this._config.closingObserver;
                if (closingObserver) {
                    closingObserver.next(undefined);
                }
                if (err && err.code) {
                    socket.close(err.code, err.reason);
                }
                else {
                    observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT));
                }
                _this._resetState();
            }, function () {
                var closingObserver = _this._config.closingObserver;
                if (closingObserver) {
                    closingObserver.next(undefined);
                }
                socket.close();
                _this._resetState();
            });
            if (queue && queue instanceof ReplaySubject_1.ReplaySubject) {
                subscription.add(queue.subscribe(_this.destination));
            }
        };
        socket.onerror = function (e) {
            _this._resetState();
            observer.error(e);
        };
        socket.onclose = function (e) {
            if (socket === _this._socket) {
                _this._resetState();
            }
            var closeObserver = _this._config.closeObserver;
            if (closeObserver) {
                closeObserver.next(e);
            }
            if (e.wasClean) {
                observer.complete();
            }
            else {
                observer.error(e);
            }
        };
        socket.onmessage = function (e) {
            try {
                var deserializer = _this._config.deserializer;
                observer.next(deserializer(e));
            }
            catch (err) {
                observer.error(err);
            }
        };
    };
    /** @internal */
    WebSocketSubject.prototype._subscribe = function (subscriber) {
        var _this = this;
        var source = this.source;
        if (source) {
            return source.subscribe(subscriber);
        }
        if (!this._socket) {
            this._connectSocket();
        }
        this._output.subscribe(subscriber);
        subscriber.add(function () {
            var _socket = _this._socket;
            if (_this._output.observers.length === 0) {
                if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
                    _socket.close();
                }
                _this._resetState();
            }
        });
        return subscriber;
    };
    WebSocketSubject.prototype.unsubscribe = function () {
        var _socket = this._socket;
        if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
            _socket.close();
        }
        this._resetState();
        _super.prototype.unsubscribe.call(this);
    };
    return WebSocketSubject;
}(Subject_1.AnonymousSubject));
exports.WebSocketSubject = WebSocketSubject;
