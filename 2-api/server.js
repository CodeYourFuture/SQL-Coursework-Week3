const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.json("Welcome to the cyf_ecommerce server");
});

app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers", (err, result) => {
    if (!err) {
      res.status(200).json(result.rows);
    } else {
      res.status(400);
      console.error(err);
    }
  });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT * FROM customers WHERE id=$1",
    [customerId],
    (err, result) => {
      if (!err) {
        res.status(200).json(result.rows);
      } else {
        res.status(400);
        console.error(err);
      }
    }
  );
});

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(
      "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, supplier.supplier_name, order_items.quantity FROM order_items INNER JOIN orders on order_id = orders.id INNER JOIN customers ON customer_id = customers.id INNER JOIN product_availability ON prod_id=product_id INNER JOIN suppliers ON supp_id = suppliers.id INNER JOIN products ON prod_id = products.id WHERE customers.id=$1",
      [customerId]
    )
    .then((result) => {
      res.status(200).json(result.rows);
    })
    .catch((err) => console.error(err));
});

app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const updateName = req.body.name;
  const updateAddress = req.body.address;
  const updateCity = req.body.city;
  const updateCountry = req.body.country;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Customer not found");
      } else {
        pool.query(
          `UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=${customerId}`,
          [updateName, updateAddress, updateCity, updateCountry],
          (err, result) => {
            if (!err) {
              res
                .status(200)
                .send("Customer successfully updated")
                .json(result.rows);
            } else {
              console.error(err);
            }
          }
        );
      }
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.orderDate;
  const newOrderRef = req.body.orderRef;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400);
      }
    })
    .query(
      "INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)",
      [customerId, newOrderDate, newOrderRef],
      (err, result) => {
        if (!err) {
          res.status(200).json(result.rows);
        } else {
          res.status(400);
          console.error(err);
        }
      }
    );
});

app.post("/customers", (req, res) => {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  if (!newName) {
    return res.status(404).send("Please enter your name to proceed");
  }
  pool
    .query("SELECT name FROM customers WHERE id=$1", [newName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(404).send("Customer name already exists!");
      } else {
        pool.query(
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)",
          [newName, newAddress, newCity, newCountry],
          (err, result) => {
            if (!err) {
              res.status(200).send("Customer Added").json(result.rows);
            } else {
              res.status(400);
              console.error(err);
            }
          }
        );
      }
    });
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
    .then(() => {
      pool.query(
        "DELETE FROM customers WHERE id=$1",
        [customerId],
        (err, result) => {
          if (!err) {
            res.status(200).send("Success! Customer deleted").json(result.rows);
          } else {
            res.status(400).send("Unable to process request");
            console.error(err);
          }
        }
      );
    });
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (err, result) => {
    if (!err) {
      res.status(200).json(result.rows);
    } else {
      res.status(400);
      console.error(err);
    }
  });
});

app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool.query("DELETE FROM orders WHERE id=$1", [orderId], (err, result) => {
        if (!err) {
          res.status(200).send("Order deleted successfully").json(result.rows);
        } else {
          res.status(400).send("Unable to delete order");
          console.error(err);
        }
      });
    });
});

app.get("/products", (req, res) => {
  const productName = req.query.productName;
  pool.query(
    `SELECT product_name, unit_price, supplier_name FROM product_availability INNER JOIN products ON prod_id = products.id INNER JOIN suppliers ON supp_id = suppliers.id ${
      productName ? "WHERE product_name ILIKE $1" : ""
    }`,
    productName ? [`%${productName}%`] : [],
    (err, result) => {
      if (!err) {
        res.status(200).json(result.rows);
      } else {
        res.status(400);
        console.error(err);
      }
    }
  );
});

app.post("/products", (req, res) => {
  const newProduct = req.body.newProduct;
  pool
    .query("SELECT product_name FROM products WHERE product_name=$1", [
      newProduct,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(404).send("Product already exists");
      } else {
        pool.query(
          "INSERT INTO products (product_name) VALUES ($1)",
          [newProduct],
          (err, result) => {
            if (!err) {
              res.status(200).json(result.rows);
            } else {
              res.status(400);
              console.error(err);
            }
          }
        );
      }
    });
});

app.post("/availability", (req, res) => {
  const productId = req.body.prodId;
  const newPrice = req.body.price;
  const supplierId = req.body.supplierId;
  if (newPrice <= 0) {
    return res.status(404).send("Invalid pricing option");
  }
  pool
    .query(
      "SELECT products.id, suppliers.id FROM products, suppliers WHERE prod_id=$1 AND supp_id=$2",
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Product or Supplier doesn't exist");
      } else {
        pool.query(
          "INSERT INTO product_availability (prod_id, unit_price, supp_id) VALUES ($1, $2, $3)",
          [productId, newPrice, supplierId],
          (err, result) => {
            if (!err) {
              res
                .status(200)
                .send("New product added and availability updated")
                .json(result.rows);
            } else {
              res.status(400);
              console.error(err);
            }
          }
        );
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
