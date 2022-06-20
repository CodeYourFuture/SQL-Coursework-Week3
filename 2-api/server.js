const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

//get product
app.get("/products", (req, res) => {
  const productName = req.query.productName;

  let query;
  if (productName) {
    query = `SELECT unit_price,supplier_name,product_name FROM products INNER JOIN product_availability as pa ON products.id= pa.prod_id INNER JOIN suppliers ON suppliers.id=pa.supp_id WHERE products.product_name LIKE '%${productName}%'`;
  } else {
    query = `SELECT unit_price,supplier_name,product_name FROM products INNER JOIN product_availability as pa ON products.id= pa.prod_id INNER JOIN suppliers ON suppliers.id=pa.supp_id`;
  }
  pool
    .query(query)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//get one customer
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const query = `SELECT * FROM customers WHERE id=${customerId}`;
  pool
    .query(query)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//create new customer
app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query =
    "INSERT INTO customers (name,address,city,country) values ($1,$2,$3,$4)";

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => {
      res.send("New customer added");
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//create new product
app.post("/products", (req, res) => {
  const newProductName = req.body.name;

  const query = "INSERT INTO products (product_name) values ($1)";

  pool
    .query(query, [newProductName])
    .then(() => {
      res.send("New product added");
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//create new product availability
app.post("/availability", (req, res) => {
  const prodId = req.body.prodId;
  const suppId = req.body.suppId;
  const unitPrice = req.body.unitPrice;

  if (unitPrice < 0) {
    res.status(404).send("please enter the correct price").end();
  }

  pool
    .query(
      `SELECT products.id,suppliers.id FROM products,suppliers where products.id=${prodId} AND suppliers.id=${suppId}`
    )
    .then((result) => {
      if (result.rows.length == 0) {
        res
          .status(404)
          .send("this product or suppliers is not available")
          .end();
      } else {
        const query =
          "INSERT INTO product_availability (prod_id,supp_id,unit_price) VALUES ($1,$2,$3)";
        pool
          .query(query, [prodId, suppId, unitPrice])
          .then(() => {
            res.send("data created");
          })
          .catch((error) => {
            res.status(500).send(error);
          });
      }
    });
});

//create new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const orderDate = req.body.orderDate;
  const orderReference = req.body.orderReference;

  pool
    .query(`SELECT customers.id FROM customers WHERE id=${customerId}`)
    .then((result) => {
      if (result.rows.length == 0) {
        res
          .status(404)
          .send(
            `There is no customer with the id of ${customerId} in the customers table`
          );
      } else {
        const query =
          "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1,$2,$3)";
        pool
          .query(query, [orderDate, orderReference, customerId])
          .then(() => {
            res.send("order created");
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    });
});

//Update customer detail
app.put("/customers/:customerId", (req, res) => {
  const customerDetails = req.body;
  const customerId = req.params.customerId;
  const arr = Object.keys(customerDetails);
  let setQuery = "";

  arr.forEach((key, index) => {
    setQuery += `${key}='${customerDetails[key]}'`;

    if (index < arr.length - 1) {
      setQuery += ",";
    }
  });
  let query = `UPDATE customers  SET ${setQuery} WHERE id=${customerId}`;

  pool
    .query(query)
    .then(() => {
      res.send("updated");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//Delete existing order
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool.query("DELETE FROM orders WHERE id=$1", [orderId]).then(() => {
        res.send(`The order with the order id of ${orderId} has been deleted`);
        res.send("deleted");
      });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query(`SELECT * FROM orders WHERE customer_id=${customerId}`)
    .then((result) => {
      if (result.rows.length > 0) {
        res
          .status(404)
          .send("This customer has order/orders so it can not be deleted");
      } else {
        pool
          .query(`DELETE FROM customers where id=${customerId}`)
          .then(() => {
            res.send(`Customer with the id of ${customerId} has been deleted`);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    });
});

//get order based on one specific customer id
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  let query =
    "SELECT orders.id,order_date,order_reference,unit_price,quantity,product_name,supplier_name FROM ";
  query +=
    "orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON ";
  query +=
    "order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id ";
  query +=
    "INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1";
  pool
    .query(query, [customerId])
    .then((result) => {
      res.send(result.rows);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
const port = 3000;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
