module.exports = {
  apps: [
    {
      name: 'dynamics-hubspot-api',
      script: './index.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: 'dynamics-hubspot-sync',
      script: './jobs/index.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/sync-error.log',
      out_file: './logs/sync-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      cron_restart: '0 */4 * * *',  // Reinicia cada 4 horas
      max_restarts: 10,
      restart_delay: 4000,
    }
  ]
};