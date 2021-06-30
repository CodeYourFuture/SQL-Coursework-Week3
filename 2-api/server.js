const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "yasemin",
  port: 5432,
});

// Add a new GET endpoint `/customers` to return all the customers from the database
app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (db_err, db_res) => {
    if (db_err) {
      res.send(JSON.stringify(db_err));
    } else {
      res.json(db_res.rows);
    }
  });
});

// Add a new GET endpoint `/suppliers` to return all the suppliers from the database
app.get("/suppliers", function (req, res) {
  pool.query("SELECT * FROM suppliers", (db_err, db_res) => {
    if (db_err) {
      res.send(JSON.stringify(db_err));
    } else {
      res.json(db_res.rows);
    }
  });
});

// Add a new GET endpoint `/orders` to return all the orders from the database
app.get("/orders", function (req, res) {
  pool.query("SELECT * FROM orders", (db_err, db_res) => {
    if (db_err) {
      res.send(JSON.stringify(db_err));
    } else {
      res.json(db_res.rows);
    }
  });
});

//1.2 Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`.
// This endpoint should still work even if you don't use the `name` query parameter!
app.get("/products", function (req, res) {
  const productName = req.query.name;
  let productQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id= product_availability.prod_id INNER JOIN suppliers ON suppliers.id= product_availability.supp_id";

  if (productName) {
    productQuery = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id= product_availability.prod_id INNER JOIN suppliers ON suppliers.id= product_availability.supp_id WHERE products.product_name ILIKE '%${productName}%';`;
  }

  pool
    .query(productQuery)
    .then((result) => res.json(result.rows))
    .catch((e) => res.send(JSON.stringify(e)));
});

//3. Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customer_Id", function (req, res) {
  const customerId = req.params.customer_Id;

  pool
    .query(`SELECT * FROM customers WHERE id = ${customerId}`)
    .then((result) => res.json(result.rows))
    .catch((e) => res.send(JSON.stringify(e)));
});

//4.Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName) {
    return res.status(400).send("Name of the customer shouldn't be empty!!");
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else if (
        !newCustomerAddress ||
        !newCustomerCity ||
        !newCustomerCountry
      ) {
        return res
          .status(400)
          .send(
            "The address, city and country of the customer shouldn't be empty!!"
          );
      } else {
        const customerQuery =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4);";
        pool
          .query(customerQuery, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((e) => res.send(JSON.stringify(e)));
      }
    })
    .catch((e) => res.send(JSON.stringify(e)));
});

// 5. Add a new POST endpoint `/products` to create a new product.
app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;

  if (!newProductName) {
    return res.status(400).send("Name of the product shouldn't be empty!!");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const productQuery = "INSERT INTO products (product_name) VALUES ($1);";
        pool
          .query(productQuery, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((e) => res.send(JSON.stringify(e)));
      }
    })
    .catch((e) => res.send(JSON.stringify(e)));
});

// 6.Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id).
//  Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", function (req, res) {
  const newProductId = req.body.prod_id;
  const newProductSupplierId = req.body.supp_id;
  const newProductUnitPrice = req.body.unit_price;

  if (
    !Number.isInteger(newProductId) ||
    !Number.isInteger(newProductSupplierId) ||
    !Number.isInteger(newProductUnitPrice)
  ) {
    return res
      .status(400)
      .send(
        "The product ID, supplier ID and product unit price should be a positive integer and should not be empty!!!"
      );
  }

  pool
    .query("SELECT * FROM products WHERE id=$1", [newProductId])
    .then((result) => {
      if (result.rows.length != 0) {
        pool
          .query("SELECT * FROM suppliers WHERE id=$1", [newProductSupplierId])
          .then((result) => {
            if (result.rows.length != 0) {
              pool
                .query(
                  "SELECT unit_price FROM product_availability WHERE prod_id=$1 AND supp_id=$2;",
                  [newProductId, newProductSupplierId]
                )
                .then((result) => {
                  if (result.rows.length > 0) {
                    return res
                      .status(400)
                      .send(`This product availability already exists!!`);
                  }
                  pool
                    .query(
                      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);",
                      [newProductId, newProductSupplierId, newProductUnitPrice]
                    )
                    .then(() => res.send("Product Availability Created!"))
                    .catch((e) => res.send(JSON.stringify(e)));
                })
                .catch((e) => res.send(JSON.stringify(e)));
            } else {
              return res.status(400).send("Supplier has not found.");
            }
          })
          .catch((e) => res.send(JSON.stringify(e)));
      } else {
        return res
          .status(400)
          .send(`Product with ID:${newProductId} has not found.`);
      }
    })
    .catch((e) => res.send(JSON.stringify(e)));
});

//7.Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer.
// Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customer_Id/orders", function (req, res) {
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const customerId = req.params.customer_Id;

  if (!newOrderDate || !newOrderReference) {
    return res
      .status(400)
      .send("Order date and Order reference should not be empty!!");
  }

  pool
    .query("SELECT id FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length != 0) {
        pool
          .query(
            "SELECT * FROM orders WHERE order_reference=$1 AND customer_id=$2",
            [newOrderReference, customerId]
          )
          .then((result) => {
            if (result.rows.length > 0) {
              return res.status(400).send(`Order already exists!`);
            } else {
              const orderQuery =
                "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3);";
              pool
                .query(orderQuery, [
                  newOrderDate,
                  newOrderReference,
                  customerId,
                ])
                .then(() => res.send("Order created!"))
                .catch((e) => res.send(JSON.stringify(e)));
            }
          });
      }
    })
    .catch((e) => res.send(JSON.stringify(e)));
});

//8.Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customer_Id", function (req, res) {
  const customerId = req.params.customer_Id;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  if (newName && newAddress && newCity && newCountry) {
    pool
      .query(
        "UPDATE customers SET name=$1,  address=$2, city=$3, country=$4 WHERE id=$5",
        [newName, newAddress, newCity, newCountry, customerId]
      )
      .then(() => res.send(`Customer ${customerId} updated!`))
      .catch((e) => res.send(JSON.stringify(e)));
  } else {
    return res.status(400).send("Please fill all the fields!!");
  }
});

//9.Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() =>
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`Order ${orderId} deleted!`))
        .catch((e) => res.send(JSON.stringify(e)))
    )
    .catch((e) => res.send(JSON.stringify(e)));
});

// 10.Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((e) => res.send(JSON.stringify(e)));
      } else {
        res
          .status(400)
          .send(`The customer ${customerId} has orders and can't be deleted!!`);
      }
    })
    .catch((e) => res.send(JSON.stringify(e)));
});

// 11.Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer.
//Especially, the following information should be returned:
// order references, order dates, product names, unit prices, suppliers and quantities.

app.get("/customers/:customer_Id/orders", function (req, res) {
  const customerId = req.params.customer_Id;

  let ordersQuery = "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM orders INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN products ON products.id = order_items.product_id INNER JOIN suppliers ON suppliers.id= order_items.supplier_id INNER JOIN product_availability ON order_items.product_id= product_availability.prod_id AND order_items.supplier_id= product_availability.supp_id WHERE orders.customer_id =$1 ORDER BY orders.order_reference";

  pool
    .query(ordersQuery, [customerId])
    .then((data) => res.json(data.rows))
    .catch((e) => res.send(JSON.stringify(e)));
});
