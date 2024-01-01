import { defineConfig } from 'vite';
import million from 'million/compiler';
import react from '@vitejs/plugin-react-swc';
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [inject({ Buffer: ['buffer', 'Buffer'] }), million.vite({ auto: true }), react()],
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
      renderer: "/src/components/renderer/*",
      types: "/src/components/types/*",
      libs: "/src/components/libs/*",
      drivers: "/src/components/drivers/*",
      dialects: "/src/components/dialects/*",
      '@app': '/src/BI/*'
    },
  },

  build: {
    manifest: true,
    rollupOptions: {
      external: [
        "/src/components/renderer/*",
        "/src/components/types/*",
        "/src/components/libs/*",
        "/src/components/drivers/*",
        "/src/components/dialects/*",
        "/src/BI/*"
      ],
    },
  },
})
