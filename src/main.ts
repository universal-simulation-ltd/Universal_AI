import './app.css'
import App from './App.svelte'
import { mount } from 'svelte'
import { followThemeWithStatusBar } from './lib/systemBars'

console.log(`build: ${import.meta.env.VITE_BUILD_SHA}`)

const app = mount(App, { target: document.getElementById('app')! })

// Native shell only: the status-bar glyphs follow the app's theme, not the phone's.
followThemeWithStatusBar()

export default app
