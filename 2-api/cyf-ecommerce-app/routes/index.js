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

router.get("/customers/:id", function (req, res) {
  db.query(
    "SELECT * FROM customers WHERE id=$1",
    [parseInt(req.params.id)],
    (db_err, db_res) => {
      if (db_err) {
        res.status(502).send(db_err);
      } else {
        res.json(db_res.rows);
      }
    }
  );
});

router.post("/customers", function (req, res) {
  const { name, address, city, country } = req.body;
  const sqlCommand =
    "INSERT INTO customers (name,address, city, country) VALUES ($1, $2, $3, $4)";
  db.query(sqlCommand, [name, address, city, country], (db_err, db_res) => {
    if (db_err) {
      res.status(502).send(db_err);
    } else {
      res.json(db_res.rows);
    }
  });
});

router.put("/customers/:customerId", function (req, res) {
  const { name, address, city, country } = req.body;
  const customerId = req.params.customerId;
  const sqlCheckCmd = `SELECT * FROM customers WHERE id=$1`;
  const sqlUpdateCmd =
    "UPDATE customers SET (name,address, city, country) =  ($1, $2, $3, $4) WHERE id=$5";
  db.query(sqlCheckCmd, [customerId])
    .then((db_res) => {
      if (db_res === 0) {
        res.status(400).send("Please send valid customer id");
      } else {
        const c = db_res.rows[0];
        db.query(sqlUpdateCmd, [
          name || c.name,
          address || c.address,
          city || c.city,
          country || c.country,
          customerId,
        ])
          .then((dbRes) => res.json(dbRes.rowCount))
          .catch((dbErr) => {
            res.status(502).send(dbErr);
          });
      }
    })
    .catch((db_err) => res.json(db_err));
});

router.get("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;
  const sqlDeleteCmd = `SELECT * FROM orders WHERE id=$1`;

  db.query(sqlDeleteCmd, [orderId])
    .then((db_res) => res.json(db_res.rows))
    .catch((db_err) => res.status(400).send("Please check your request Id"));
});

router.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;
  const sqlDeleteCmd1 = `DELETE FROM orders WHERE id=$1`;
  const sqlDeleteCmd2 = `DELETE FROM order_items WHERE order_id=$1`;

  db.query(sqlDeleteCmd2, [orderId])
    .then(() => {
      db.query(sqlDeleteCmd1, [orderId])
        .then((db_res) => res.json(db_res.rowCount))
        .catch((dbErr) => res.json(dbErr));
    })
    .catch((db_err) => res.status(400).json(db_err));
});

router.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const sqlDeleteCmd = `DELETE FROM customers WHERE id=$1`;
  const sqlCheckCmd = `SELECT * FROM orders WHERE customer_id=$1`;

  db.query(sqlCheckCmd, [customerId])
    .then((db_res) => {
      if (db_res.rows.length !== 0) {
        res.status(400).send("Have to check orders first");
      } else {
        db.query(sqlDeleteCmd, [customerId])
          .then((db_res) => res.json(db_res.rowCount))
          .catch((dbErr) => res.json(dbErr));
      }
    })
    .catch((db_err) => res.status(400).json(db_err));
});
//availability to create a new product availability (with a price and a supplier id)
router.post("/availability", function (req, res) {
  const { price, supplierId, productId } = req.body;

  if (price < 0) {
    res.status(400).send("Please send valid Price");
  } else {
    db.query(
      "SELECT * FROM products WHERE id=$1",
      [productId],
      (db_err, db_res) => {
        if (db_err) {
          res.status(502).send({ error: "DB Query error" });
        } else if (db_res.rowCount === 0) {
          res.status(400).send("Please send valid ProductID");
        } else {
          db.query(
            "SELECT * FROM suppliers WHERE id=$1",
            [supplierId],
            (db_err, db_res) => {
              if (db_err) {
                res.status(502).send(db_err);
              } else if (db_res.rowCount === 0) {
                res.status(400).send("Please send valid SupplierID");
              } else {
                db.query(
                  "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
                  [productId, supplierId, parseInt(price)],
                  (db_err, db_res) => {
                    console.log(db_res);
                    if (db_err) {
                      res.status(502).send(db_err);
                    } else {
                      res.json({ message: "Successful" });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
});

// order references, order dates, product names, unit prices, suppliers and quantities.
router.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  console.log(customerId);
  const sqlCommand = `SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, oi.quantity  FROM orders o INNER JOIN order_items oi ON o.id = oi.order_id INNER JOIN products p ON oi.product_id = p.id INNER JOIN product_availability pa ON oi.product_id = pa.prod_id INNER JOIN suppliers s ON oi.supplier_id = s.id WHERE customer_id=1`;

  db.query(sqlCommand)
    .then((db_res) => res.json(db_res.rows))
    .catch((db_err) => res.json(db_err));
});

router.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const sqlCommand = `INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)`;
  db.query(`SELECT * FROM customers WHERE id=$1`, [customerId])
    .then((db_res) => {
      if (db_res.rowCount === 0) {
        res.status(400).send("Customer ID is not found");
      } else {
        db.query(sqlCommand, [
          req.body.order_date,
          req.body.order_reference,
          customerId,
        ])
          .then((dbRes) => res.json(dbRes))
          .catch((dbErr) => {
            throw dbErr;
          });
      }
    })
    .catch((db_err) => res.json(db_err));
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
