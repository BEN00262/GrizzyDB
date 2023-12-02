import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   headers: {
  //     'Cross-Origin-Opener-Policy': 'same-origin',
  //     'Cross-Origin-Embedder-Policy': 'require-corp',
  //   },
  // },
  // optimizeDeps: {
  //   exclude: ['@sqlite.org/sqlite-wasm'],
  // },
  resolve: {
    alias: {
      renderer: "/src/components/renderer",
      types: "/src/components/types",
      libs: "/src/components/libs",
      drivers: "/src/components/drivers",
      dialects: "/src/components/dialects",
    },
  },
})
