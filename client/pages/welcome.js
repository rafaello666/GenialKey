"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("next/link"));
const WelcomeScreen_module_css_1 = __importDefault(require("../styles/WelcomeScreen.module.css"));
const framer_motion_1 = require("framer-motion");
const WelcomeScreen = () => {
    <framer_motion_1.motion.div className={WelcomeScreen_module_css_1.default.welcomeScreen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
    <framer_motion_1.motion.h1 initial={{ y: -50 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      Witaj w Aplikacji Szybkiego Pisania
    </framer_motion_1.motion.h1>
    <framer_motion_1.motion.p initial={{ y: 50 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
      Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
    </framer_motion_1.motion.p>

    <framer_motion_1.motion.div className={WelcomeScreen_module_css_1.default.actions} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <link_1.default href="/courses">
        <button className={WelcomeScreen_module_css_1.default.primaryButton}>Wybierz ćwiczenie</button>
      </link_1.default>
      <link_1.default href="/lessons">
        <button className={WelcomeScreen_module_css_1.default.secondaryButton}>Rozpocznij naukę</button>
      </link_1.default>
    </framer_motion_1.motion.div>
  </framer_motion_1.motion.div>;
    return (<div className={WelcomeScreen_module_css_1.default.welcomeScreen}>
      <h1>Witaj w Aplikacji Szybkiego Pisania</h1>
      <p>
        Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
        Wybierz ćwiczenie, aby przejść do praktyki.
      </p>          
      </div>);
};
exports.default = WelcomeScreen;
