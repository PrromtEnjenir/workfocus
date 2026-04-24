import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import plCommon from './locales/pl/common.json'
import plTasks from './locales/pl/tasks.json'
import enCommon from './locales/en/common.json'
import enTasks from './locales/en/tasks.json'

void i18n.use(initReactI18next).init({
  resources: {
    pl: {
      common: plCommon,
      tasks: plTasks,
    },
    en: {
      common: enCommon,
      tasks: enTasks,
    },
  },
  lng: 'pl',
  fallbackLng: 'pl',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
