'use strict';

module.exports = {
  apps: [
    {
      name: "kme-server",
      script: "./index.js",
      instances: "max",
      exec_mode: "cluster",
      out_file: "/dev/stdout",
      error_file: "/dev/stdout",
      env_development: {
        "NODE_ENV": "development"
      },
      env_staging: {},
      env_production: {}
    }
  ]
};
