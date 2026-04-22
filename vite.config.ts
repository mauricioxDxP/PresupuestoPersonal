import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'



export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(),'')
  console.log(env)


  return {

    plugins: [react()],

    server: {

      host: '0.0.0.0',

      allowedHosts: ['desktop-mauricio'],

      port: Number(env.PORT) || 5173,

    },

  }

})
