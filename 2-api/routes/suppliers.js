const express = require('express');
const router = express.Router();
const pool = require('../utils/pool');

// return all the suppliers from the database
router.get("/", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    if (error) {
      console.log(error);
      return res.send(error);
    }
    res.json(result.rows);
  });
});



module.exports = router;