const express = require("express");

const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.PG_CONNECT,
});

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

// for getting suppliers
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//  GET PRODUCTS
app.get("/products", function (req, res) {
  pool

    .query(
      `SELECT products.product_name AS product, product_availability.unit_price AS price, suppliers.supplier_name AS supplier
        FROM product_availability
        JOIN products
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON suppliers.id = product_availability.supp_id`
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET CUSTOMER WITH AN ID

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length) {
        return res.json(result.rows[0]);
      } else {
        return res
          .status(404)
          .send({ msg: `Customer ${customerId} doesn't exist` });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// ADDING A CUSTOMER
app.post("/customers", function (req, res) {
  let customerName = req.body.name;
  let customerAddress = req.body.address;
  let customerCity = req.body.city;
  let customerCountry = req.body.country;

  if (!customerName || !customerAddress || !customerCity || !customerCountry) {
    return res.status(400).send({ msg: "Please fill in the required fields." });
  }
  pool
    .query("SELECT * FROM customers WHERE name = $1", [customerName])
    .then((result) => {
      if (result.rows.length) {
        return res
          .status(404)
          .send({ msg: `Customer ${customerName} already exists` });
      } else {
        pool
          .query(
            `INSERT INTO customers (name, address, city, country) Values($1, $2, $3, $4)`,
            [customerName, customerAddress, customerCity, customerCountry]
          )
          .then(() =>
            res.send({ msg: `Customer ${customerName} added successfully.` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// ADDING A PRODUCT
app.post("/products", function (req, res) {
  const productName = req.body.product;

  if (!productName) {
    return res.status(404).send({
      msg: `Product name is required !`,
    });
  }
  pool
    .query("SELECT * FROM products WHERE product_name = $1", [productName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send({
          msg: `A product with similar name:${productName} already exists !`,
        });
      } else {
        pool
          .query(`INSERT INTO products(product_name) VALUES($1)`, [productName])
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

// ADDING PRODUCT AVAILABILITY
app.post("/availability", function (req, res) {
  let productId = req.body.prod_id;
  let productPrice = req.body.unit_price;
  let supplierId = req.body.supp_id;
  if (!Number.isNumber(productPrice) || productPrice < 0) {
    return res.status(400).send({ msg: "Enter a Valid Price!" });
  }
  if (!supplierId) {
    return res.status(400).send({ msg: "Supplier id is missing!" });
  }
  pool
    .query("SELECT * FROM products WHERE id =$1", [productId])
    .then((result) => {
      // if (result.rows.length === 0) {
      //   return res
      //     .status(400)
      //     .send({ msg: `Product id:${productId} does not exist` });
      // } else

      // IT CAN WORK WITHOUT ABOVE CODE
      if (result.rows.length > 0) {
        pool
          .query("SELECT * FROM suppliers WHERE id =$1", [supplierId])
          .then((result) => {
            if (result.rows.length === 0) {
              return res
                .status(400)
                .send({ msg: `Product id:${supplierId} does not exist` });
            }
          });
      } else {
        pool
          .query(
            `INSERT INTO product_availability (prod_id,unit_price,supp_id ) VALUES($1,$2,$3)`,
            [productId, productPrice, supplierId]
          )
          .then(() => res.send({ msg: `Product:${productId} added` }))
          .catch((error) => {
            console.log(error);
            res.json(error);
          });
      }
    });
});

// GET A CUSTOMER'S ORDER
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

// ADDING A ORDER
app.post("/customers/:customerId/orders", function (req, res) {
  let customerId = req.params.customerId;
  let orderRef = req.body.order_reference;
  let orderDate = req.body.order_date;

  pool
    .query("SELECT * FROM customers where id = $1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .send({ msg: `Customer:${customerId} does not exist` });
      } else {
        pool
          .query(
            "INSERT INTO customers(customer_id,order_reference,order_date ) VALUES($1, $2, $3)",
            [customerId, orderRef, orderDate]
          )
          .then(() => res.send({ msg: `Order:${orderRef} added` }))
          .catch((error) => {
            console.log(error);
            res.json(error);
          });
      }
    });
});

//  UPDATING CUSTOMER DETAILS
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
      let originalCustomer = result.rows[0]; //Returns object
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

// DELETE AN ORDER
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

//  DELETE A CUSTOMER
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

app.listen(5000, function () {
  console.log("Server is listening on port 5000. Ready to accept requests!");
});
