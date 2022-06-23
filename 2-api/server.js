const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const pool = new Pool({
  user: "timea",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "password",
  post: 5432,
});

app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers").then((result) => res.send(result));
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers").then((result) => res.send(result));
});
//////new homework///////

app.get("/products?", (req, res) => {
  const searchWord = "%" + req.query.name + "%";
  console.log(searchWord);
  if (req.query.name !== undefined) {
    pool
      .query("SELECT * FROM products WHERE product_name LIKE $1", [searchWord])
      .then((result) => res.send(result));
  } else {
    pool
      .query(
        "SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name FROM product_availability INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id;"
      )
      .then((result) => res.send(result));
  }
});

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const orderDate = req.body.date;
  // let orderRef = pool
  //   .query("SELECT FROM orders")
  //   .then((response) => (orderRef = response.rows.length + 1));
  // console.log(orderRef);
  const orderRef = "ORD50";
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1,$2,$3)";
        pool
          .query(query, [orderDate, orderRef, customerId])
          .then(() => res.send("Order added!"));
      } else {
        res.status(400).send("No customer with this ID");
      }
    });
});
app.post("/customers", (req, res) => {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  const query =
    "INSERT INTO customers (name, address,city,country) VALUES ($1,$2,$3,$4)";
  pool
    .query(query, [newName, newAddress, newCity, newCountry])
    .then(() => res.send("Customer added!"))
    .catch((err) => {
      console.error(err);
      res.status(400).send("Customer not added!");
    });
});
app.post("/products", (req, res) => {
  const newProduct = req.body.product;
  pool
    .query("INSERT INTO products (product_name) VALUES ($1)", [newProduct])
    .then(() => {
      res.send("Product added!");
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send("Couldn't add product!");
    });
});

app.post("/availability", (req, res) => {
  const prodId = req.body.productId;
  const suppId = req.body.supplierId;
  const price = req.body.price;
  console.log(prodId);
  console.log(suppId);
  console.log(price);

  if (!Number.isInteger(price) || price <= 0) {
    res.status(400).send("Please enter a number");
  }
  pool
    .query(
      "SELECT * FROM product_availability WHERE supp_id=$1 AND prod_id=$2;",
      [suppId, prodId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        res
          .status(400)
          .send("Product ID and supplier ID combination already exists!");
      } else if (result.rows.length === 0) {
        res.status(400).send("No product/supplier exists for this ID!");
      } else {
        const query =
          "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES($1,$2,$3)";
        pool
          .query(query, [price, suppId, prodId])
          .then(() => res.send("Availability added!"));
      }
    });
});

//
app.delete("/orders/:orderId", (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId)) {
    return res.status(400).send("Please make sure ID is an integer!");
  }
  pool
    .query(
      "SELECT * FROM orders FULL OUTER JOIN order_items ON orders.id=order_items.order_id WHERE orders.id=$1",
      [orderId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        pool
          .query("DELETE FROM order_items WHERE order_items.order_id=$1", [
            orderId,
          ])
          .then(() => {
            pool
              .query("DELETE FROM orders WHERE orders.id=$1", [orderId])
              .then(() => res.send("Ordered items and order deleted!"))
              .catch((err) => {
                console.error(err);
                res.send("Couldn't delete order.");
              });
          })
          .catch((err) => console.error(err));
      } else {
        res.status(400).send("No order with id.");
      }
    });
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(
      "SELECT * FROM orders INNER JOIN customers ON orders.customer_id=customers.id WHERE orders.customer_id=$1",
      [customerId]
    )
    .then((response) => {
      if (response.rows.length > 0) {
        pool
          .query("DELETE FROM orders WHERE orders.customers_id=$1", [
            customerId,
          ])
          .then(() =>
            pool
              .query("DELETE FROM customers WHERE customers.id=$1", [
                customerId,
              ])
              .then("Customer deleted.")
              .catch((err) => {
                console.error(err);
                res.send("There is an error");
              })
          )
          .catch((err) => console.error(err));
      } else {
        res.status(400).send("No customer with id.");
      }
    });
});
app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4  WHERE id=$5",
      [newName, newAddress, newCity, newCountry, customerId]
    )
    .then(() => res.send("Customer details updated!"))
    .catch((err) => {
      console.error(err);
      res.send(err);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("listening on port 3000");
});
