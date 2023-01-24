const express = require("express");
const app = express();
const { Pool } = require("pg");


const bodyParser = require("body-parser");
app.use(bodyParser.json());


const port = process.env.PORT || 3000;


// Connection String or Variable String
const pool = new Pool({
    user: "cyf_ecommerce_j3qq_user",
    host: "dpg-cf5f3eg2i3mnvcvgbka0-a.oregon-postgres.render.com",
    database: "cyf_ecommerce_j3qq",
    password: "NeC9j1aaapvbObYlSdz0LC6gzSeIhcom",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
  });


 
 // Retrieve all the Customers from the database and  loading a single customer by ID.
  app.get("/customers/:customerId", (req, res) => {
    let customerId = req.params.customerId;
    pool
      .query("SELECT * FROM customers WHERE id = $1", [customerId])
      .then((result) => {
        if (result.rows.length > 0) {
          res.json(result.rows[0]);
        } else {
          res.status(404).send("Customer not found");
        }
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send(error);
      });
  });
// Add a new POST endpoint /customers to create a new customer with name, address, city and country.
  app.post("/customers", (req, res) => {
    let { name, address, city, country } = req.body;
    pool
      .query(
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)",
        [name, address, city, country]
      )
      .then((result) => {
        res.status(200).send("Customer created");
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send(error);
      });
  });

 
// Add a new POST endpoint /customers/:customerId/orders
  app.post("/customers/:customerId/orders", (req, res) => {
    let customerId = req.params.customerId;
    let {order_date, order_reference} = req.body;
    if (!order_date || !order_reference) {
        return res.status(400).send("Missing required fields");
    }
    pool
      .query("SELECT * FROM customers WHERE id = $1", [customerId])
      .then((result) => {
        if (result.rows.length === 0) {
            return res.status(404).send("Customer not found");
        }
        pool
          .query("INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)", [customerId, order_date, order_reference])
          .then(() => {
            res.status(200).send("Order created");
          })
          .catch((error) => {console.error(error);
            res.status(500).send(error);
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
});

// Add a new POST endpoint /customers/:customerId/orders 
app.post("/customers/:customerId/orders", (req, res) => {
  let customerId = req.params.customerId;
  let {order_date, order_reference} = req.body;
  if (!order_date || !order_reference) {
      return res.status(400).send("Missing required fields");
  }
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
          return res.status(404).send("Customer not found");
      }
      pool
        .query("INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)", [customerId, order_date, order_reference])
        .then(() => {
          res.status(200).send("Order created");
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

// Add a new PUT endpoint /customers/:customerId
app.put("/customers/:customerId", (req, res) => {
  let customerId = req.params.customerId;
  let { name, address, city, country } = req.body;
  if (!name || !address || !city || !country) {
      return res.status(400).send("Missing required fields");
  }
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
          return res.status(404).send("Customer not found");
      }
      pool
        .query("UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5", [name, address, city, country, customerId])
        .then(() => {
          res.status(200).send("Customer updated");
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

// Add a new DELETE endpoint /customers/:customerId
app.delete("/customers/:customerId", (req, res) => {
  let customerId = req.params.customerId;
  pool.query("SELECT * FROM orders WHERE customer_id = $1", [customerId])
  .then((result) => {
      if (result.rows.length > 0) {
          return res.status(400).send("Customer has orders, can not be deleted");
      }
      pool.query("DELETE FROM customers WHERE id = $1", [customerId])
      .then(() => {
          res.status(200).send("Customer deleted");
      })
      .catch((error) => {
          console.error(error);
          res.status(500).send(error);
      });
  })
  .catch((error) => {
      console.error(error);
      res.status(500).send(error);
  });
});

// Add a new DELETE endpoint /customers/:customerId
app.get("/customers/:customerId/orders", (req, res) => {
  let customerId = req.params.customerId;
  pool
      .query("SELECT o.reference, o.date, p.product_name, p.unit_price, s.supplier_name, oi.quantity FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id JOIN suppliers s ON p.supplier_id = s.id WHERE o.customer_id = $1", [customerId])
      .then((result) => {
          res.json(result.rows);
      })
      .catch((error) => {
          console.error(error);
          res.status(500).send(error);
      });
});
  
  // Retrieve all the Suppliers from the database
  app.get("/suppliers", (req, res) => {
    pool
      .query("SELECT * FROM suppliers")
      .then((result) => {
        res.json(result.rows);
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send(error);
      });
  });
  
  // Retrieve all the product names along with their prices and supplier names, and filter the list of products by name using a  query parameter
  app.get("/products", (req, res) => {
    let name = req.query.name;
    let sqlQuery = "SELECT product_name,unit_price,supplier_name FROM products INNER JOIN product_availability as pa ON pa.prod_id=products.id INNER JOIN suppliers ON suppliers.id=pa.supp_id";
    if (name) {
        sqlQuery += " WHERE product_name LIKE '%" + name + "%'";
    }
    pool
      .query(sqlQuery)
      .then((result) => {
        res.json(result.rows);
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send(error);
      });
});

// Add a new POST endpoint /products to create a new product.
app.post("/products", (req, res) => {
  let { product_name} = req.body;
  pool
    .query(
      "INSERT INTO products (product_name) VALUES ($1)",
      [product_name]
    )
    .then((result) => {
      res.status(200).send("Product created");
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send(error);
    });
});


// Add a new POST endpoint /availability
app.post("/availability", (req, res) => {
  let { prod_id, supp_id, price } = req.body;
  if (!prod_id || !supp_id || !price) {
      return res.status(400).send("Missing required fields");
  }
  if (parseInt(price) <= 0) {
      return res.status(400).send("Price must be a positive integer");
  }
  pool
    .query("SELECT * FROM products WHERE id = $1", [prod_id])
    .then((result) => {
      if (result.rows.length === 0) {
          return res.status(404).send("Product not found");
      }
      pool
        .query("SELECT * FROM suppliers WHERE id = $1", [supp_id])
        .then((result) => {
          if (result.rows.length === 0) {
              return res.status(404).send("Supplier not found");
          }
          pool
          .query("INSERT INTO product_availability (prod_id, supp_id, price) VALUES ($1, $2, $3)", [prod_id, supp_id, price])
          .then(() => {
            res.status(201).send("Product availability created");
          })
          .catch((error) => {
            console.error(error)
            res.status(500).send(error);
          });
    })
    .catch((error) => {
        console.error(error)
        res.status(500).send(error);
    });
  })
  .catch((error) => {
    console.error(error)
    res.status(500).send(error);
  });
});

// Add a new DELETE endpoint /orders/:orderId
app.delete("/orders/:orderId", (req, res) => {
  let orderId = req.params.orderId;

  pool.query("SELECT * FROM orders WHERE id = $1", [orderId])
  .then((result) => {
      if (result.rows.length === 0) {
          return res.status(404).send("Order not found");
      }
      pool.query("DELETE FROM order_items WHERE order_id = $1", [orderId])
      .then(() => {
          pool.query("DELETE FROM orders WHERE id = $1", [orderId])
          .then(() => {
              res.status(200).send("Order deleted");
          })
          .catch((error) => {
              console.error(error);
              res.status(500).send(error);
          });
      })
      .catch((error) => {
          console.error(error);
          res.status(500).send(error);
      });
  })
  .catch((error) => {
      console.error(error);
      res.status(500).send(error);
  });
});



app.listen(port, () => {
  console.log(`Listen in http://localhost:${port}`);
  });











































