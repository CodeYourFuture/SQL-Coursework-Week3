const express = require("express");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const app = express();
dotenv.config();
app.use(express.json());
const dbConfig = {
  host: "localhost",
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "cyf_ecommerce",
};

const pool = new Pool(dbConfig);

//Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  const query = `SELECT * FROM customers WHERE id=$1;`;

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({ msg: "Invalid input" });
  }

  pool
    .query(query, [customerId])
    .then((result) => {
      if (result.rows.length <= 0) {
        res
          .status(404)
          .json({ msg: `No customer with id ${customerId} has been found` });
      } else {
        res.json(result.rows);
      }
    })
    .catch((error) => res.status(500).json(error));
});

//- If you don't have it already, add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.
//- Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

app.get("/products", (req, res) => {
  const productNameQuery = req.query.name;
  let query = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN products ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id  ORDER BY product_name`;
  let params = [];
  if (productNameQuery) {
    query = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN products ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id  WHERE products.product_name LIKE $1 ORDER BY products.product_name`;
    params.push(`%${productNameQuery}%`);
  }

  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => res.status(500).json(error));
});

//POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    !newCustomerName &&
    !newCustomerAddress &&
    !newCustomerCity &&
    !newCustomerCountry
  ) {
    return res.status(400).json({
      result: "failure",
      msg: "The new customer couldn't be added.The name, address, city and country are all required",
    });
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).json({
          result: "failure",
          msg: "A customer with the same name already exists",
        });
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.json({ msg: "Customer added!" }))
          .catch((error) => {
            res.status(400).json(error);
          });
      }
    })
    .catch((error) => res.status(400).json(error));
});

// POST endpoint `/products` to create a new product.
app.post("/products", (req, res) => {
  const newProduct = req.body.product_name;

  if (!newProduct) {
    return res.status(400).json({
      result: "failure",
      msg: "Product not specified",
    });
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProduct])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).json({
          result: "failure",
          msg: `The product ${newProduct} already exists`,
        });
      } else {
        const query = "INSERT INTO products (product_name) VALUES($1)";
        pool
          .query(query, [newProduct])
          .then(() => res.json({ msg: "The new product was added successful" }))
          .catch((error) => {
            res.status(400).json(error);
          });
      }
    })
    .catch((error) => res.status(400).json(error));
});

//Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error

app.post("/availability", (req, res) => {
  const price = req.body.unit_price;
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;

  if (!Number.isInteger(price) && price <= 0) {
    return res.status(400).json({
      result: "failure",
      msg: "Invalid input. The price should be a positive number",
    });
  }

  pool
    .query(
      `SELECT product_availability.prod_id, product_availability.supp_id 
      FROM product_availability 
      INNER JOIN products ON products.id = product_availability.prod_id 
      INNER JOIN suppliers ON suppliers.id = product_availability.supp_id 
      WHERE product_availability.prod_id = $1 AND product_availability.supp_id = $2`,
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rows.length == 0) {
        return res.status(400).json({
          result: "failure",
          msg: `Id not found`,
        });
      } else {
        const query = `SELECT prod_id, supp_id FROM product_availability WHERE prod_id = $1 AND supp_id = $2`;
        pool.query(query, [productId, supplierId]).then((result) => {
          if (result.rows.length > 0) {
            return res.status(400).json({
              result: "failure",
              msg: "This product availability already exists",
            });
          } else {
            const query =
              "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES($1, $2, $3)";
            pool
              .query(query, [productId, supplierId, price])
              .then(() =>
                res.json({
                  msg: "A new product availability was added successful",
                })
              )
              .catch((error) => {
                res.status(400).json(error);
              });
          }
        });
      }
    })
    .catch((error) => res.status(400).json(error));
});

//- Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req, res) => {
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  const customerId = Number(req.params.customerId);

  if (!orderDate) {
    return res.status(400).json({
      result: "failure",
      msg: "An orderDate value is required.",
    });
  } else if (!orderReference) {
    return res.status(400).json({
      result: "failure",
      msg: "An orderReference value is required.",
    });
  }

  pool
    .query(
      `SELECT * FROM customers INNER JOIN orders ON orders.customer_id = customers.id WHERE customers.id = $1`,
      [customerId]
    )
    .then((result) => {
      if (result.rows.length == 0) {
        return res.status(400).json({
          result: "failure",
          msg: `Invalid customerId value.`,
        });
      } else {
        const query = `INSERT INTO orders (order_date, order_reference, customer_id) VALUES($1, $2, $3)`;
        pool
          .query(query, [orderDate, orderReference, customerId])
          .then(() =>
            res.json({
              msg: "Order has been successful created.",
            })
          )
          .catch((error) => {
            res.status(400).json(error);
          });
      }
    })
    .catch((error) => res.status(400).json(error));
});

//- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  console.log(customerId);

  const customerName = req.body.name;
  const customerAddress = req.body.address;
  const customerCity = req.body.city;
  const customerCountry = req.body.country;

  pool
    .query(`SELECT * FROM customers WHERE id = $1`, [customerId])
    .then((result) => {
      if (result.rows.length == 0) {
        return res.status(400).json({
          result: "failure",
          msg: `Invalid customerId value.`,
        });
      } else {
        const query = `UPDATE customers SET name =$1 , address = $2, city = $3, country = $4  WHERE id= $5`;
        pool
          .query(query, [
            customerName,
            customerAddress,
            customerCity,
            customerCountry,
            customerId,
          ])
          .then(() =>
            res.json({
              msg: `The customer's details/detail with id ${customerId} have/has been successful updated`,
            })
          )
          .catch((error) => {
            res.status(401).json(error);
          });
      }
    })
    .catch((error) => res.status(400).json(error));
});

//- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query(`SELECT * FROM orders WHERE id = $1`, [orderId])
    .then((result) => {
      if (result.rows.length == 0) {
        return res.status(400).json({
          result: "failure",
          msg: `Invalid orderId.`,
        });
      } else {
        pool
          .query(`DELETE FROM order_items WHERE order_id=$1`, [orderId])
          .then(() => pool.query(`DELETE FROM orders WHERE id = $1`, [orderId]))
          .then(() => res.send(`Order with id ${orderId} has been deleted!`))
          .catch((error) => res.status(500).json(error));
      }
    })
    .catch((error) => res.status(500).json(error));
});

//- Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      `SELECT * FROM orders INNER JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1`,
      [customerId]
    )
    .then((result) => {
      if (result.rows.length == 0) {
        pool
          .query(`DELETE FROM customers WHERE id=$1`, [customerId])
          .then(() =>
            res.send(`The customer with id ${customerId} has been removed`)
          )
          .catch((error) => res.status(500).json(error));
      } else {
        return res.status(400).json({
          result: "failure",
          msg: `The customer with id ${customerId} couldn't be deleted because he has orders`,
        });
      }
    })
    .catch((error) => res.status(500).json(error));
});

//- Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = Number(req.params.customerId);
  const query = 
  `SELECT customers.name AS customer, orders.order_date, orders.order_reference, products.product_name AS product, product_availability.unit_price , suppliers.supplier_name AS supplier, order_items.quantity AS quantity
  FROM customers 
  INNER JOIN orders ON customers.id = orders.customer_id 
  INNER JOIN order_items ON order_items.order_id = orders.id 
  INNER JOIN suppliers ON suppliers.id = order_items.supplier_id
  INNER JOIN products ON products.id = order_items.product_id 
  INNER JOIN product_availability ON product_availability.prod_id = products.id 
  WHERE customers.id=$1 ORDER BY customers.name;`;

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({ msg: "Invalid input" });
  }

  pool
    .query(query, [customerId])
    .then((result) => {
      if (result.rows.length <= 0) {
        res
          .status(404)
          .json({ msg: `No customer with id ${customerId} has been found` });
      } else {
        res.json(result.rows);
      }
    })
    .catch((error) => res.status(500).json(error));
});

app.listen(3001, () => console.log("Listening on port 3001."));
