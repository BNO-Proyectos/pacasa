module.exports = {
  apps: [
    {
      name: "api-dynamics",
      script: "index.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      restart_delay: 4000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: "integracion-hubspot",
      script: "integracionContacto.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      restart_delay: 4000,
      depends_on: ["api-dynamics"]
    }
  ]
}; 