import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import tm from "./locales/tm.json";
import ru from "./locales/ru.json";

function getInitialLang() {
  if (typeof window === "undefined") return "tm";

  try {
    const savedLang = localStorage.getItem("lang");

    return ["en", "tm", "ru"].includes(savedLang) ? savedLang : "tm";
  } catch {
    return "tm";
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tm: { translation: tm },
    ru: { translation: ru },
  },

  lng: getInitialLang(),
  fallbackLng: "en",

  supportedLngs: ["en", "tm", "ru"],

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
