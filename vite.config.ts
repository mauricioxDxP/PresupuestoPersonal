import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'


export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(),'')
  console.log(env)

  const isDev = mode === 'development';

  return {

    plugins: [react()],

    server: {
      // Use HTTP in dev, HTTPS only in production
      ...(isDev ? {} : {
        https: {
          key: fs.readFileSync('./localhost-key.pem'),
          cert: fs.readFileSync('./localhost.pem'),
        },
      }),

      host: '0.0.0.0',

      allowedHosts: isDev ? ['.mauricioxdxp.site', 'desktop-mauricio'] : ['.mauricioxdxp.site'],

      port: Number(env.PORT) || 5173,

    },

  }

})
