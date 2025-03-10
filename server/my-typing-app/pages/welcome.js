"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("next/link"));
const WelcomeScreen_module_css_1 = __importDefault(require("../styles/WelcomeScreen.module.css"));
const WelcomeScreen = () => {
    return (<div className={WelcomeScreen_module_css_1.default.welcomeScreen}>
      <h1>Witaj w Aplikacji Szybkiego Pisania</h1>
      <p>
        Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
        Wybierz ćwiczenie, aby przejść do praktyki.
      </p>

      <div className={WelcomeScreen_module_css_1.default.actions}>
        {/* Przejście np. do listy dostępnych kursów (lekcji) */}
        <link_1.default href="/courses">
          <button className={WelcomeScreen_module_css_1.default.primaryButton}>Wybierz ćwiczenie</button>
        </link_1.default>

        {/* Przykładowy przycisk startu bezpośrednio */}
        <link_1.default href="/lessons">
          <button className={WelcomeScreen_module_css_1.default.secondaryButton}>Rozpocznij naukę</button>
        </link_1.default>
      </div>
    </div>);
};
exports.default = WelcomeScreen;
