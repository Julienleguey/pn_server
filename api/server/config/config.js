require("dotenv").config();

module.exports = {
  development: {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    dialect: "postgres",
  },

  test: {
    database: "pn_server_test",
    username: "postgres",
    password: null,
    host: "127.0.0.1",
    dialect: "postgres",
  },

  production: {
    use_env_variable: "DATABASE_URL",
    database: process.env.DATABASE_URL,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
