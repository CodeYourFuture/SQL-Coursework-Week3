const { Pool } = require("pg");
const pool = new Pool({
  user: "Home-PC",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "pgsql",
  port: 5432,
});

module.exports = pool;