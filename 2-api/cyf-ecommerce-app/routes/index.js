const router = require("express").Router();
const db = require("../db");

require("dotenv").config();

router.get("/", function (req, res) {
  res.json({
    endpoints: ["/customers", "/suppliers", "/products"],
  });
});

router.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (db_err, db_res) => {
    if (db_err) {
      res.status(502).send(db_err);
    } else {
      res.json(db_res.rows);
    }
  });
});

router.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers", (db_err, db_res) => {
    if (db_err) {
      res.status(502).send(db_err);
    } else {
      res.json(db_res.rows);
    }
  });
});

router.get("/products", function (req, res) {
  const sqlCommand = `SELECT p.product_name, pa.unit_price, s.supplier_name
                 FROM products p
                 INNER JOIN product_availability pa ON p.id = pa.prod_id
                 INNER JOIN suppliers s ON pa.supp_id = s.id`;

  if (req.query.name) {
    db.query(
      `${sqlCommand} WHERE product_name ~* $1`,
      [req.query.name],
      (db_err, db_res) => {
        if (db_err) {
          res.status(502).send(db_err);
        } else {
          res.json(db_res.rows);
        }
      }
    );
  } else {
    db.query(`${sqlCommand}`, (db_err, db_res) => {
      if (db_err) {
        res.status(502).send(db_err);
      } else {
        res.json(db_res.rows);
      }
    });
  }
});

module.exports = router;
