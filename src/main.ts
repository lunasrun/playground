import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import init from './wasm'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vscode/localExtensionHost'
import { defaultApi } from 'vscode/localExtensionHost'
import "@codingame/monaco-vscode-editor-api";

defaultApi

const vuetify = createVuetify({
  components,
  directives
})

await init()

createApp(App).use(vuetify).mount('#app')
