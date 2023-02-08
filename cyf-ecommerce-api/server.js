const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "codeyourfuture",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123",
  port: 5432,
});

app.use(express.json());

app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//week3
app.get("/products", (req, res) => {
  let productQuery = req.query.name;
  //pool
  let query =
    "SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id";
  let params = [];
  if (productQuery) {
    query =
      "SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id where products.product_name = $1";

    params.push(productQuery);
  }

  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE customers.id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//POST `/customers`
app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => res.send("New customer created"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//PUT `/customers/:customerId`
app.put("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  const customerName = req.body.name;
  const customerAddress = req.body.address;
  const customerCity = req.body.city;
  const customerCountry = req.body.country;

  if (customerName) {
    pool.query("UPDATE customers SET name = $1 WHERE id = $2", [
      customerName,
      customerId,
    ]);
  }
  if (customerAddress) {
    pool.query("UPDATE customers SET address = $1 WHERE id = $2", [
      customerAddress,
      customerId,
    ]);
  }
  if (customerCity) {
    pool.query("UPDATE customers SET city = $1 WHERE id = $2", [
      customerCity,
      customerId,
    ]);
  }
  if (customerCountry) {
    pool.query("UPDATE customers SET country = $1 WHERE id = $2", [
      customerCountry,
      customerId,
    ]);
  }
  res.send("Customer name updated");
});

//post new product
app.post("/products", (req, res) => {
  const productName = req.body.product_name;
  const unitPrice = req.body.unit_price;
  const supplierName = req.body.supplier_name;
  const query =
    "INSERT INTO products (id,name, address, city, country) VALUES ( (SELECT MAX(id) FROM products) + 1 , $1, $2, $3)";
  const params = [productName, unitPrice, supplierName];
  pool
    .query(query, params)
    .then(() => {
      pool
        .query("SELECT * FROM products")
        .then((result) => {
          res.json(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//DELETE an existing order
app.delete("/orders/:orderId", (req, res) => {
  const orderId = Number(req.params.orderId);
  const query = "DELETE FROM orders WHERE id = $1";
  const params = [orderId];
  pool.query("SELECT* FROM orders WHERE id = $1", [orderId]).then((result) => {
    let final = `${result.rowCount}`;
    if (result.rowCount == 0) {
      res.send("There is not matching order");
    }
    pool
      .query(query, params)
      .then(res.send(`Order with this ID: ${orderId} deleted`));
  });
});

//POST(/availability)
app.post("/availability", (req, res) => {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;
  pool
    .query("INSERT INTO product_availability (unit_price) VALUES ($1) ", [
      unitPrice,
    ])
    .then(res.send("Availability added"));
});

//GET "load all the orders"
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = Number(req.params.customerId);
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity, customers.id FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id JOIN product_availability ON order_items.product_id = product_availability.prod_id JOIN suppliers ON order_items.supplier_id = suppliers.id JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1";
  const params = [customerId];
  pool.query(query, params).then((result) => {
    res.send(result.rows);
  });
});

//create new order
app.post("customers/:customerId/orders", (req, res) => {
  const customerId = Number(req.params.customerId);
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      let final = `${result.rowCount}`;
      if (result.rowCount == 0) {
        res.sendStatus(404).send("Customer not exist!");
      }
      pool
        .query(
          "INSERT INTO orders (order_date, order_reference) VALUES ($1, $2)",
          [orderDate, orderReference]
        )
        .then(res.send("Order has been added"));
    });
});

//delete an existing customer
app.delete("/customers/:customerId", async (req, res) => {
  const customerID = Number(req.params.customerId);
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity, customers.id FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id JOIN product_availability ON order_items.product_id = product_availability.prod_id JOIN suppliers ON order_items.supplier_id = suppliers.id JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1";
  const params = [customerID];
  await pool.query(query, params).then((result) => {
    let final = `${result.rowCount}`;
    if (result.rowCount == 0) {
      pool
        .query("DELETE FROM customers WHERE id = $1", [customerID])
        .then(
          res.send(
            `Customer with ID :  ${customerID} does not have any order has been deleted`
          )
        );
    } else {
      res.send("Customer has some orders");
    }
  });
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
