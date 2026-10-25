import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile: bygget blir én selvgående index.html (JS + CSS inlinet), som kan
// åpnes rett fra disk uten nett – trygt for presentasjon i Tjodhallen.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
})
