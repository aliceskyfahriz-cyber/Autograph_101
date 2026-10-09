import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Kontruang — dev server di http://localhost:5173 (sama seperti prototype AutographFJ v1)
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  }
})
