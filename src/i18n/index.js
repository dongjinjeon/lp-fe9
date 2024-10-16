import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/en.json";
import esTranslation from "./locales/es/es.json";
import idTranslation from "./locales/id/id.json";
import koTranslation from "./locales/ko/ko.json";

const resources = {
  en: { translation: enTranslation },
  ko: { translation: koTranslation },
  id: { translation: idTranslation },
  es: { translation: esTranslation },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ko",
  fallbackLng: "ko",
  interpolation: {
    escapeValue: false, 
  },
});

export default i18n;
