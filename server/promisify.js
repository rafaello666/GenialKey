"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = promisify;
function promisify(fn) {
    return function (req, opts) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fn.call(_this, req, opts, function (err, rtn) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rtn);
                }
            });
        });
    };
}
