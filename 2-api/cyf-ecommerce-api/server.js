const { query } = require("express");
const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

const { Pool } = require("pg");
const moment = require("moment");

const pool = new Pool({
  user: "cyf",
  password: "cyf",
  host: "localhost",
  database: "cyf_ecommerce",
  port: "5432",
});

/*****************************************************************************/
// Get Requests
/*****************************************************************************/

app.get("/customers", (req, res) => {
  const customersQuery = "SELECT * FROM customers";

  pool
    .query(customersQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/suppliers", (req, res) => {
  const suppliersQuery = "SELECT * FROM suppliers";

  pool
    .query(suppliersQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/products", (req, res) => {
  const productNameQuery = req.query.name;

  let productsQuery = `SELECT p.product_name AS "Product Name", pa.unit_price AS
  "Unit Price", s.supplier_name AS "Supplier Name"
  FROM product_availability AS pa
  INNER JOIN products AS p ON pa.prod_id = p.id
  INNER JOIN suppliers AS s ON pa.supp_id = s.id;`;

  if (productNameQuery) {
    productsQuery = `SELECT p.product_name AS "Product Name", pa.unit_price AS
  "Unit Price", s.supplier_name AS "Supplier Name"
  FROM product_availability AS pa
  INNER JOIN products AS p ON pa.prod_id = p.id
  INNER JOIN suppliers AS s ON pa.supp_id = s.id
  WHERE p.product_name ILIKE '%${productNameQuery}%';`;
  }

  pool
    .query(productsQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  const ordersQuery = `SELECT o.id AS "Order ID",
o.order_reference AS "Order Reference",
o.order_date AS "Order Date",
p.product_name AS "Product Name",
oi.quantity AS "Product Quantity"
FROM orders AS o
INNER JOIN order_items AS oi
ON oi.order_id = o.id
INNER JOIN customers AS c
ON c.id = o.customer_id
INNER JOIN products AS p
ON p.id = oi.product_id
WHERE c.id = $1
GROUP BY o.id, oi.product_id, oi.quantity, p.product_name
ORDER BY o.id;`;

  pool
    .query(ordersQuery, [customerId])
    .then((result) => {
      if (result.rowCount > 0) {
        return res.status(200).send(result.rows);
      }
      return res
        .status(400)
        .send("Customer ID is invalid! No such customer exists.");
    })
    .catch((e) => console.error(e));
});

/*****************************************************************************/
// Post Requests
/*****************************************************************************/

app.post("/customers", (req, res) => {
  console.log(req.body);
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists.");
      } else if (
        !newCustomerAddress ||
        !newCustomerCity ||
        !newCustomerCountry
      ) {
        return res
          .status(400)
          .send(
            "The address, city and country of the customer must be non-empty"
          );
      } else {
        const customerPostQuery =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4);";

        pool
          .query(customerPostQuery, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer Created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;

  if (!newProductName) {
    return res
      .status(400)
      .send("Product name must be a non-empty string value.");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists.");
      } else {
        const productPostQuery =
          "INSERT INTO products (product_name) VALUES ($1);";

        pool
          .query(productPostQuery, [newProductName])
          .then(() => res.send("Product Created!"))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

app.post("/availability", (req, res) => {
  const newProdId = parseInt(req.body.prodId);
  const newSuppId = parseInt(req.body.suppId);
  const newUnitPrice = parseFloat(req.body.unitPrice);

  // check if all the fields exist and are non-empty number values
  if (
    !Number.isInteger(newProdId) ||
    !Number.isInteger(newSuppId) ||
    isNaN(newUnitPrice)
  ) {
    return res
      .status(400)
      .send("Product ID, Supplier ID and Unit Price must be number values.");
  }

  // check if the prod_id is valid.
  pool
    .query("SELECT id FROM products WHERE id=$1", [newProdId])
    .then((result) => {
      // if the prodId is valid, then check remaining conditions
      if (result.rowCount > 0) {
        // check if supp_id is valid.
        pool
          .query("SELECT id FROM suppliers WHERE id=$1", [newSuppId])
          .then((result) => {
            if (result.rowCount > 0) {
              // check if the product availability does not already exist in records
              pool
                .query(
                  "SELECT unit_price FROM product_availability WHERE prod_id=$1 AND supp_id=$2;",
                  [newProdId, newSuppId]
                )
                .then((result) => {
                  if (result.rowCount > 0) {
                    return res
                      .status(400)
                      .send(
                        "The product from the same supplier already exists. If you want to update the existing record, use the update feature."
                      );
                  }
                  pool
                    .query(
                      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);",
                      [newProdId, newSuppId, newUnitPrice]
                    )
                    .then(() => res.send("Product Availability Created!"))
                    .catch((e) => console.error(e));
                })
                .catch((e) => console.error(e));
            } else {
              return res
                .status(400)
                .send(
                  "The Supplier ID is not a valid value. Check and try again."
                );
            }
          })
          .catch((e) => console.error(e));
      } else {
        return res
          .status(400)
          .send("The Product ID is not a valid value. Check and try again.");
      }
    })
    .catch((e) => console.error(e));
});

app.post("/customers/:customerId/orders", (req, res) => {
  const newOrderDate = moment(req.body.orderDate, "DD-MM-YYYY", true);
  const newOrderReference = req.body.orderReference;
  const newCustomerId = req.params.customerId;

  const orderRefValidator = /^ORD[0-9]{3,}$/;

  // check if order reference is valid
  if (!orderRefValidator.test(newOrderReference)) {
    return res
      .status(400)
      .send(
        'Order reference is not a valid reference number. It must follow the format "ORDxxx".'
      );
  }

  // check if order date is a valid date.
  // The order date can further be limited to be from a certain period of time.
  if (!newOrderDate.isValid()) {
    return res.status(400).send("Enter a valid order date and try again.");
  }

  // check if a customer with the customer ID already exists
  pool
    .query("SELECT id FROM customers WHERE id=$1", [newCustomerId])
    .then((result) => {
      if (result.rowCount > 0) {
        // it means customer ID is valid and the customer exists

        // check if the order already exists
        pool
          .query(
            "SELECT * FROM orders WHERE order_reference = $1 AND customer_id = $2;",
            [newOrderReference, newCustomerId]
          )
          .then((result) => {
            if (result.rowCount > 0) {
              return res
                .status(400)
                .send(
                  "Order with the same Order Reference and Customer ID already exists."
                );
            }
            pool
              .query(
                "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3);",
                [newOrderDate, newOrderReference, newCustomerId]
              )
              .then(() => res.send("Order Created!"))
              .catch((e) => console.error(e));
          });
      }
    });
});

/*****************************************************************************/
// Put Requests
/*****************************************************************************/

app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  if (newName && newAddress && newCity && newCountry) {
    pool
      .query(
        "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5;",
        [newName, newAddress, newCity, newCountry, customerId]
      )
      .then(() => res.send(`Customer ${customerId} successfully updated!.`))
      .catch((e) => console.error(e));
  } else {
    return res.status(400).send("The update request has missing data.");
  }
});

/*****************************************************************************/
// Patch Requests
/*****************************************************************************/

app.patch("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
});

/*****************************************************************************/
// Delete Requests
/*****************************************************************************/

// Delete an order and all its corresponding order items from the DB
app.delete("/orders/:orderId", (req, res) => {
  console.log("delete function");
  const orderId = req.params.orderId;

  console.log(orderId);

  pool
    .query("DELETE FROM order_items WHERE order_id=$1;", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1;", [orderId])
        .then(() =>
          res.send(
            `Order ${orderId} and its corresponding order items deleted!`
          )
        )
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

// Delete a customer iff it does not have any orders.
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1;", [customerId])
    .then((result) => {
      if (result.rowCount > 0) {
        return res
          .status(400)
          .send("The customer has orders linked to it and cannot be deleted.");
      }
      pool
        .query("DELETE FROM customers WHERE id=$1;", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

/*****************************************************************************/
// Listen
/*****************************************************************************/

app.listen(PORT, () => console.log(`Listening on port ${PORT}.`));
