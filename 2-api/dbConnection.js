const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "cyf",
  host: "localhost",
  port: 5432,
  database: "cyf_ecommerce",
});

module.exports = pool;
