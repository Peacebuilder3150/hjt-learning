import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' にすることで、GitHub Pagesのどんな置き場所でも動くようにする
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
