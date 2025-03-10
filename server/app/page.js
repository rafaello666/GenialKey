"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const react_1 = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
function Page() {
    const [message, setMessage] = (0, react_1.useState)('Welcome to KeyGenius – Master your typing skills!');
    return (<main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-500 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 animate-pulse">
            {message}
          </h1>
          <p className="text-xl mb-8">
            Type faster, smarter, and accurately with adaptive AI-powered training.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <link_1.default href="/training">
              <button className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-50 transition-colors">
                🚀 Start Training
              </button>
            </link_1.default>

            <link_1.default href="/dashboard">
              <button className="bg-transparent border border-white py-3 px-8 rounded-lg hover:bg-white hover:text-indigo-600 transition-colors">
                📊 View Dashboard
              </button>
            </link_1.default>
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm opacity-70">
          KeyGenius © {new Date().getFullYear()} | Created with ❤️ by KeyGenius Team
        </footer>
      </div>
    </main>);
}
