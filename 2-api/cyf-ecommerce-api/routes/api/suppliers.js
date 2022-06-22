const express = require("express");
const router = express.Router();
const pool = require("../../pool");

// Gets all the suppliers
router.get("/", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});

module.exports = router;
