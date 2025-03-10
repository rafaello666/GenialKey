"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const page_1 = __importDefault(require("../src/app/page"));
describe('Page', () => {
    it('should render successfully', () => {
        const { baseElement } = (0, react_2.render)(<page_1.default />);
        expect(baseElement).toBeTruthy();
    });
});
