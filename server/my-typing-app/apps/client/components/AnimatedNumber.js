"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const framer_motion_1 = require("framer-motion");
const react_1 = __importDefault(require("react"));
const AnimatedNumber = ({ value }) => {
    return (<framer_motion_1.motion.div key={value} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
      {value}
    </framer_motion_1.motion.div>);
};
exports.default = AnimatedNumber;
