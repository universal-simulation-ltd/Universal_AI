import './app.css'
import App from './App.svelte'
import { mount } from 'svelte'

console.log(`build: ${import.meta.env.VITE_BUILD_SHA}`)

const app = mount(App, { target: document.getElementById('app')! })

export default app
