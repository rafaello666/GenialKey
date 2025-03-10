"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Update = void 0;
 % ;
if (isSwaggerInstalled) {
     %  > ;
    import { PartialType } from '@nestjs/swagger';
     % ;
}
else {
     %  > ;
    import { PartialType } from '@nestjs/mapped-types';
     % ;
}
 %  >
;
var module_1 = require();
singular(classify(name)) %  > Dto;
from;
'./create-<%= singular(name) %>.dto';
var Update = /** @class */ (function () {
    function Update() {
    }
    return Update;
}());
exports.Update = Update;
(classify(name)) %  > Dto;
(0, swagger_1.PartialType)(module_1.Create < , singular(classify(name)) %  > Dto);
{
     % ;
    if ((type === 'microservice' || type === 'ws') && crud) {
         %  >
            id;
        number;
         % ;
    }
     %  > ;
}
