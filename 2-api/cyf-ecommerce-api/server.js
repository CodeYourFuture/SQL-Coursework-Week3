const express = require("express");

const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const { query } = require("express");

const pool = new Pool({
  connectionString: process.env.PG_CONNECT,
});

/////////////////////////========POST REQUESTS=========/////////////////////////////

//  ADD A Customer
app.post("/customers", function (req, res) {
  let customerName = req.body.name;
  let customerAddress = req.body.address;
  let customerCity = req.body.city;
  let customerCountry = req.body.country;

  if (!customerName || !customerAddress || !customerCity || !customerCountry) {
    return res
      .status(400)
      .send({ msg: "Please fill in all the required fields" });
  }
  pool
    .query(`SELECT name FROM customers WHERE name = $1`, [customerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send({ msg: `Customer name:${customerName} already exist` });
      } else {
        let query = `INSERT INTO customers(name, address, city, country) VALUES ($1,$2,$3,$4)`;
        let params = [
          customerName,
          customerAddress,
          customerCity,
          customerCountry,
        ];
        pool
          .query(query, params)
          .then(() =>
            res.send({ msg: `Customer ${customerName} added Successfully` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// ADDING A NEW PRODUCT

app.post("/products", function (req, res) {
  let productName = req.body.product_name;
  pool
    .query(`SELECT * FROM products WHERE product_name = $1`, [productName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send({
          msg: `A product with similar name:${productName} already exists !`,
        });
      } else {
        let query = `INSERT INTO products (product_name) VALUES($1)`;
        let params = [productName];
        pool
          .query(query, params)
          .then(() =>
            res.send({ msg: `Product ${productName} added successfully ` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

//  ADD PRODUCT-AVAILABILITY
//  NOT working properly
app.post("/availability", function (req, res) {
  let productId = req.body.prodId;
  let productPrice = req.body.unitPrice;
  let supplierId = req.body.suppId;

  if (!Number(productPrice) || productPrice < 0 || !productId || !supplierId) {
    return res.status(400).send({ msg: `Please Enter valid data.` });
  }

  pool
    .query(`SELECT * FROM products  WHERE id = $1`, [productId])
    .then((result) => {
      if (result.rows.length) {
        pool
          .query(`SELECT * FROM suppliers  WHERE id = $1`, [supplierId])
          .then((result) => {
            if (result.rows.length) {
              let query = `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES($1, $2, $3)`;
              let params = [productId, supplierId, productPrice];
              pool
                .query(query, params)
                .then(() =>
                  res.send({ msg: `Product:${productId} added successfully ` })
                )
                .catch((error) => {
                  console.error(error);
                  res.status(500).json(error);
                });
            }
          });
      }
    });
});

// 2nd approach NOT WORKING EITHER
// app.post("/availability", (req, res) => {
//   const productId = req.body.prod_id;
//   const supplierId = req.body.supp_id;
//   const unitPrice = req.body.unit_price;
//   if (!productId || !supplierId || !unitPrice)
//     return res.status(400).send("ERROR, invalid data");
//   if (!Number.isInteger(unitPrice) || unitPrice < 0)
//     return res.status(400).send("Please enter a positive value");
//   const query =
//     "INSERT INTO product_availability (prod_id, supp_id,unit_price) VALUES ($1,$2,$3)";

//   pool
//     .query(query, [productId, supplierId, unitPrice])
//     .then(() => res.send("New product availability is added"))
//     .catch((e) => console.error(e));
// });

// CREATE A NEW ORDER
app.post("/customers/:customerId/orders", function (req, res) {
  let customerId = req.params.customerId;
  let orderRef = req.body.order_reference;
  let orderDate = req.body.order_date;

  let query = `SELECT * FROM customers WHERE id = $1`;
  pool.query(query, [customerId]).then((result) => {
    if (result.rows.length == 0) {
      return res
        .status(404)
        .send({ msg: `Customer:${customerId} doesn't exist` });
    } else {
      let query = `INSERT INTO orders (order_date,order_reference,customer_id ) VALUES ($1,$2,$3)`;
      let params = [orderDate, orderRef, customerId];
      pool
        .query(query, params)
        .then(() =>
          res.status(404).send({ msg: `Order:${orderRef} added successfully` })
        )
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    }
  });
});

/////////////////////////========GET REQUESTS=========/////////////////////////////

// GET ALL THE CUSTOMERS
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET ALL THE SUPPLIERS
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET PRODUCTS AND ALSO SEARCH FUNCTIONALITY
app.get("/products", function (req, res) {
  let productsQuery = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name
        FROM product_availability
        JOIN products
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON suppliers.id = product_availability.supp_id`;
  let searchQuery = req.query.name;

  if (searchQuery) {
    pool
      .query(
        `${productsQuery} WHERE product_name LIKE '%${searchQuery}%' ORDER BY product_name`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  } else {
    pool
      .query(productsQuery)
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});

// GET all the orders along with the items in the orders of a specific customer.

app.get("/customers/:customerId/orders", function (req, res) {
  let customerId = req.params.customerId;
  let query = `SELECT customers.name,orders.order_reference, orders.order_date, products.product_name,product_availability.unit_price, suppliers.supplier_name, order_items.quantity
   FROM customers
   JOIN orders
   ON orders.id = orders.customer_id
   JOIN order_items 
   ON order_items.order_id = orders.id
   JOIN products
   ON products.id = order_items.product_id
   JOIN suppliers 
   ON suppliers.id = order_items.supplier_id
   JOIN product_availability 
   ON product_availability.supp_id = order_items.product_id
   WHERE customers.id = $1
   ORDER BY orders.order_date `;
  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET CUSTOMER WITH AN ID
app.get("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;
  let query = `SELECT * FROM customers WHERE id = $1`;
  const params = [customerId];
  pool
    .query(query, params)
    .then((result) => {
      if (result.rows.length == 0) {
        return res
          .status(404)
          .send({ msg: `Customer ${customerId} doesn't exist` });
      }
      res.json(result.rows);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

/////////////////////////========PUT REQUESTS=========/////////////////////////////

// UPDATE A CUSTOMER'S INFO

app.put("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  // Checking if the customer with Id entered exist or not
  pool
    .query(`SELECT * FROM customers WHERE id = $1`, [customerId])
    .then((result) => {
      if (result.rows.length == 0) {
        return res
          .status(404)
          .send({ msg: `Customer ${customerId} doesn't exist` });
      }
    });

  // First we select the customer then we can update the changes else we will can return the old info
  pool
    .query(`SELECT * FROM customers WHERE id = $1`, [customerId])
    .then((result) => {
      let originalCustomer = result.rows[0];
      let updateQuery = `UPDATE customers
        SET name = $2, address = $3, city = $4, country = $5
        WHERE id = $1`;
      let params = [
        customerId,
        newName || originalCustomer.name,
        newAddress || originalCustomer.address,
        newCity || originalCustomer.city,
        newCountry || originalCustomer.country,
      ];

      pool
        .query(updateQuery, params)
        .then(() => res.send(`Customer ${customerId} updated!`))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    });
});

/////////////////////////========DELETE REQUESTS=========/////////////////////////////

// DELETE ORDER

app.delete("/orders/:orderId", function (req, res) {
  let orderId = req.params.orderId;
  // First we have to delete all the items in that order
  let itemsDelQuery = `DELETE FROM order_items where order_id = $1 `;
  let orderDelQuery = `DELETE FROM orders where id = $1`;
  pool
    .query(itemsDelQuery, [orderId])
    .then(() => pool.query(orderDelQuery, [orderId]))
    .then(() => res.send({ msg: `Order: ${orderId} deleted successfully` }))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//  DELETE A CUSTOMER ONLY IF THEY DON'T HAVE ANY ORDERS

app.delete("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;

  let query = `DELETE FROM customers where id = $1`;

  pool
    .query(`SELECT FROM orders WHERE customer_id = $1`, [customerId])
    .then((result) => {
      if (result.rows.length >= 1) {
        return res.status(400).send({
          msg: `Customer: ${customerId} can not be deleted because they have pending orders !`,
        });
      }
      pool
        .query(query, [customerId])
        .then(() =>
          res.send({ msg: `Customer: ${customerId} deleted successfully ` })
        )
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    });
});

// LISTENER

app.listen(3001, function () {
  console.log("Server is listening on port 3001. Ready to accept requests!");
});
