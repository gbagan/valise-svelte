import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Valise Maths à modeler',
        short_name: 'Valise MAM',
        start_url: '/~mam/valise/',
        scope: '/~mam/valise/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0000ff'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webm,webp}']
      }
    }),
  ],
})
