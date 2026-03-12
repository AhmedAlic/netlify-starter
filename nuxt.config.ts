// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [
      tailwindcss() as any,
    ],
  },
  experimental: { appManifest: false },
  modules: ["@nuxt/icon"],
  compatibilityDate: "2024-12-18",
});
