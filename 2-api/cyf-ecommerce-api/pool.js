const { Pool } = require("pg");

const pool = new Pool({
  user: "craig",
  database: "cyf_ecommerce",
  host: "localhost",
  password: "",
  port: 5432,
});

module.exports = pool;
