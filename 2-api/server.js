const express = require("express");
const app = express();
const { Pool } = require("pg");
const { resourceLimits } = require("worker_threads");

app.use(express.json());

const PORT = 3000;

const pool = new Pool({
  user: "harsheek",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5433,
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers;")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers;")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Update the previous GET endpoint /products to filter the list of products by name using a query parameter, for example /products?name=Cup. This endpoint should still work even if you don't use the name query parameter!
app.get("/products", function (req, res) {
  let nameQuery = req.query.name;
  let queryToPass = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id;`;

  if (nameQuery) {
    queryToPass = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id where products.product_name LIKE '%${nameQuery}%';`;
  }
  pool
    .query(queryToPass)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Add a new GET endpoint /customers/:customerId to load a single customer by ID.
app.get("/customers/:customersId", function (req, res) {
  let customersId = parseInt(req.params.customersId);

  pool
    .query(`SELECT * FROM customers where id=${customersId};`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Add a new POST endpoint /customers to create a new customer with name, address, city and country.
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    !newCustomerName ||
    !newCustomerAddress ||
    !newCustomerCity ||
    !newCustomerCountry
  ) {
    return res.status(400).send("Please provide all information required.");
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new POST endpoint /products to create a new product.
app.post("/products", function (req, res) {
  const newProductName = req.body.name;

  if (!newProductName) {
    return res.status(400).send("Please provide all information required.");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new POST endpoint /availability to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", function (req, res) {
  const newProductAvailabilityId = parseInt(req.body.prod_id);
  const newSupplierId = parseInt(req.body.supp_id);
  const newUnitPrice = parseInt(req.body.unit_price);

  if (newUnitPrice < 0) {
    return res.status(400).send("Please provide a valid number.");
  }

  pool
    .query(
      "SELECT * FROM product_availability WHERE prod_id=$1 AND supp_id=$2",
      [newProductAvailabilityId, newSupplierId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name and price already exists!");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductAvailabilityId, newSupplierId, newUnitPrice])
          .then(() => res.send("Product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/order", function (req, res) {
  const newOrderCustomerId = parseInt(req.params.customerId);
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [newOrderCustomerId])
    .then((result) => {
      if (!result.rows.length > 0) {
        return res.status(400).send("This customer does not exist");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, newOrderReference, newOrderCustomerId])
          .then(() => res.send("Order created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", function (req, res) {
  const customerId = parseInt(req.params.customerId);
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    !newCustomerName ||
    !newCustomerAddress ||
    !newCustomerCity ||
    !newCustomerCountry
  ) {
    return res.status(400).send("Please provide all information required.");
  }

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (!result.rows.length > 0) {
        return res.status(400).send("This customer does not exist");
      } else {
        const query =
          "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
            customerId,
          ])
          .then(() => res.send("Customer updated!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new DELETE endpoint /orders/:orderId to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", function (req, res) {
  let orderId = parseInt(req.params.orderId);

  pool
    .query("DELETE FROM order_items WHERE order_id =$1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
    .then(() => res.send(`Order ${orderId} and order items deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Add a new DELETE endpoint /customers/:customerId to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", function (req, res) {
  let customerId = parseInt(req.params.customerId);

  pool
    .query("SELECT * from orders where customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("This customer has existing orders");
      } else {
        const query = "DELETE FROM customers WHERE id =$1";
        pool
          .query(query, [customerId])
          .then(() =>
            pool.query("DELETE FROM customers WHERE id=$1", [customerId])
          )
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new GET endpoint /customers/:customerId/orders to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
app.get("/customers/:customerId/orders", function (req, res) {
  let customerId = parseInt(req.params.customerId);

  pool
    .query(
      "select orders.id as order_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity from orders inner join order_items on orders.id = order_items.order_id inner join product_availability on order_items.product_id = product_availability.prod_id inner join products on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.prod_id where orders.customer_id = $1;",
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.listen(PORT, () => {
  console.log(`Hello my service is running on port ${PORT}`);
});
