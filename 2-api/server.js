const { query } = require("express");
const e = require("express");
const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv").config();
const app = express();
const dbHost = process.env.HOST;
const database = process.env.DATABASE;
const dbPort = process.env.PORT;
const dbUser = process.env.USER;
const dbPassword = process.env.PASSWORD;

app.use(express.json());

// Specify the connection parameters in an object
const dbConfig1 = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: database,
};

// Create a connection pool to the DB server
const pool = new Pool(dbConfig1);

// get the names of all customers in the database
app.get("/customers", (req, res) => {
  const customersQuery = `SELECT name FROM customers`;
  pool
    .query(customersQuery)
    .then((result) => res.json(result.rows))
    .catch((error) => res.status(500).json(error));
});

// get customer information by customer id
app.get("/customers/:customerId", (req, res) => {
  const custId = req.params.customerId;
  const custIdQuery = `SELECT * FROM customers WHERE id=$1`;
  pool
    .query(custIdQuery, [custId])
    .then((result) => {
      if (result.rows.length === 1) {
        return res.json(result.rows[0]);
      } else {
        return res.status(500).json({ message: "invalid customer id" });
      }
    })
    .catch((error) => res.status(500).json(error));
});

// get all order information for given customer id
app.get("/customers/:customerId/orders", (req, res) => {
  const custId = req.params.customerId;
  const allQuery = `SELECT orders.order_reference,orders.order_date,products.product_name,product_availability.unit_price,suppliers.supplier_name,order_items.quantity FROM order_items 
INNER JOIN orders ON order_items.order_id=orders.id 
INNER JOIN product_availability ON order_items.product_id=product_availability.prod_id 
INNER JOIN products ON order_items.product_id=products.id 
INNER JOIN suppliers ON order_items.supplier_id=suppliers.id WHERE customer_id=$1`;

  pool
    .query(allQuery, [custId])
    .then((result) => res.json(result.rows))
    .catch((error) => res.status(500).json(error));
});

// get the names of all the suppliers in the database
app.get("/suppliers", (req, res) => {
  const suppliersQuery = `SELECT supplier_name FROM suppliers`;
  pool
    .query(suppliersQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error));
});

// get all products or products by  full name/part of name
app.get("/products", (req, res) => {
  let prodName = req.query.name;
  let productsQuery = `SELECT products.product_name,product_availability.unit_price,suppliers.supplier_name FROM product_availability INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id`;

  if (prodName) {
    productsQuery += ` WHERE product_name LIKE '%' || $1 || '%';`;
    pool
      .query(productsQuery, [prodName])
      .then((result) => res.json(result.rows))
      .catch((error) => res.status(500).json(error));
  } else {
    pool
      .query(productsQuery)
      .then((result) => res.send(result.rows))
      .catch((error) => res.status(500).send(error));
  }
});

// add a new customer to the database
app.post("/customers", (req, res) => {
  const custName = req.body.name;
  const custAddress = req.body.address;
  const custCity = req.body.city;
  const custCountry = req.body.country;

  if (!custName || !custAddress || !custCity || !custCountry) {
    res.status(400).json({ message: "customer information incomplete" });
  }
  pool
    .query(`SELECT * FROM customers WHERE name = $1 AND address = $2`, [
      custName,
      custAddress,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).json({ message: "customer already exists" });
      } else {
        const addCustQuery = `INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)`;
        pool
          .query(addCustQuery, [custName, custAddress, custCity, custCountry])
          .then(() => res.send("new customer added"))
          .catch((error) => res.status(500).json(error));
      }
    });
});

// add a new product to the database
app.post("/products", (req, res) => {
  const newProduct = req.body.product;
  const newProdQuery = `INSERT INTO products (product_name) VALUES ($1) RETURNING *`;
  if (!newProduct) {
    res.status(400).json({ message: "product information incomplete" });
  }
  pool
    .query(newProdQuery, [newProduct])
    .then(() => res.json({ message: "new product added" }))
    .catch((error) => res.status(500).json(error));
});

// add new product availability
app.post("/availability", (req, res) => {
  const prodId = req.body.productId;
  const suppId = req.body.supplierId;
  const price = req.body.price;

  if (!prodId || prodId < 1 || !suppId || suppId < 1 || !price || price < 1) {
    res.status(400).json({ message: "incorrect information entered" });
  }
  const addavailQuery = `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1,$2,$3)`;
  const prodIdQuery = `SELECT prod_id FROM product_availability`;
  const suppIdQuery = `SELECT supp_id FROM product_availability`;
  const sameQuery = `SELECT prod_id,supp_id FROM product_availability WHERE prod_id=$1 AND supp_id=$2`;
  pool
    .query(sameQuery, [prodId, suppId])
    .then((result) => {
      if (result.rows.length > 0) {
        res
          .status(400)
          .json({ message: "product availability already exists" });
      } else if (result.rows.length === 0) {
        pool.query(prodIdQuery).then((result) => {
          let prodIds = result.rows.map((element) => {
            return element.prod_id;
          });
          if (!prodIds.includes(prodId)) {
            res.status(400).json({ message: "product id invalid" });
          } else {
            pool.query(suppIdQuery).then((result) => {
              let suppIds = result.rows.map((element) => {
                return element.supp_id;
              });
              if (!suppIds.includes(suppId)) {
                res.status(400).json({ message: "supplier id invalid" });
              } else {
                pool
                  .query(addavailQuery, [prodId, suppId, price])
                  .then(() =>
                    res.json({ message: "new product availability added" })
                  )
                  .catch((error) => res.json(error));
              }
            });
          }
        });
      }
    })
    .catch((error) => res.status(500).json(error));
});

// add a new order
app.post("/customers/:customerId/orders", (req, res) => {
  const custId = parseInt(req.params.customerId);
  const orderDate = req.body.date;
  const orderRef = req.body.reference;

  if (!Number.isInteger(custId) || !custId) {
    res.status(404).json({ message: "please enter a valid customer id" });
  }
  const isCustQuery = `SELECT id FROM customers`;
  const addOrderQuery = `INSERT INTO orders (order_date,order_reference,customer_id) VALUES($1,$2,$3)`;
  pool.query(isCustQuery).then((result) => {
    let validIdArr = result.rows.map((element) => {
      return element.id;
    });
    if (!validIdArr.includes(custId)) {
      res.status(404).json({ message: "customer id does not exist" });
    } else {
      pool
        .query(addOrderQuery, [orderDate, `ORD0${orderRef}`, custId])
        .then(() => res.json({ message: "new order added" }))
        .catch((error) => res.status(500).json(error));
    }
  });
});

// update customer by id
app.put("/customers/:customerId", (req, res) => {
  const custId = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  let params = [];
  const getCustQuery = `SELECT * FROM CUSTOMERS WHERE id=$1`;
  const updateCustQuery = `UPDATE customers SET name=$2,address=$3,city=$4,country=$5 WHERE id=$1`;

  pool.query(getCustQuery, [custId]).then((result) => {
    return pool
      .query(updateCustQuery, [
        custId,
        name || result.rows[0].name,
        address || result.rows[0].address,
        city || result.rows[0].city,
        country || result.rows[0].country,
      ])
      .then(() =>
        res.status(200).json({ message: `customer ${custId} updated` })
      )
      .catch((error) => res.status(500).json(error));
  });
});

// delete order and order-items by id
app.delete("/orders/:orderId", (req, res) => {
  const delOrder = req.params.orderId;

  const orderItemsQuery = `DELETE FROM order_items WHERE order_id=$1`;
  const orderQuery = `DELETE FROM orders WHERE id=$1`;

  pool
    .query(orderItemsQuery, [delOrder])
    .then(() => pool.query(orderQuery, [delOrder]))
    .then(() => res.json({ message: `order ${delOrder} deleted` }))
    .catch((error) => res.json(error));
});

// delete customer if the customer has no orders
app.delete("/customers/:customerId", (req, res) => {
  const custId = req.params.customerId;
  const getCustQuery = `SELECT customer_id FROM orders`;
  const delCustQuery = `DELETE FROM customers WHERE id=$1`;
  pool.query(getCustQuery).then((result) => {
    let custIds = result.rows.map((element) => element.customer_id);
    if (!custIds.includes(custId) && custId > 0) {
      pool
        .query(delCustQuery, [custId])
        .then(() => res.json({ message: `customer ${custId} deleted` }))
        .catch((error) => res.json(error));
    } else {
      res.json({ message: "customer could not be deleted" });
    }
  });
});

app.listen(3000, () => console.log("Listening on port 3000."));
