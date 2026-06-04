// PM2 进程管理配置
// 在项目根目录执行: pm2 start deploy/ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "omni-gen",
      script: "npx",
      args: "tsx index.ts",
      cwd: "/www/wwwroot/omnigen.septemc.com/server",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        PROMPTS_PASSWORD: "b4Hqn2sVt45CBphZLT84",
        PROMPTS_DIR: "/www/wwwroot/omnigen.septemc.com/reference/Prompts",
        JWT_SECRET: "6mocDS8FNQQcWmmD9o586moYVj6YLWR9",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/www/wwwroot/omnigen.septemc.com/server/logs/error.log",
      out_file: "/www/wwwroot/omnigen.septemc.com/server/logs/out.log",
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "300M",
    },
  ],
};
