const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_hotels",
  password: "admin",
  port: 5432,
});

app.get("/customers", (req, res) => {
  res.send("Hello");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
