const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "admin",
  port: 5432,
});

//////////////////////////  GET POINTS //////////////////////////////////////

// Add a new GET endpoint `/customers/` to load all the customers.
app.get("/customers", (req, res) => {
  pool.query("SELECT *FROM customers", (result) => {
    res.json(result.rows);
  });
});
// Add a new GET endpoint `/products/` to load all the products.
app.get("/products", (req, res) => {
  pool.query("SELECT *FROM products", (result) => {
    res.json(result.rows);
  });
});
// Add a new GET endpoint `/availability/` to load all the products.
app.get("/availability", (req, res) => {
  pool.query("SELECT *FROM product_availability", (result) => {
    res.json(result.rows);
  });
});
// Add a new GET endpoint `/orders` to load all the orders.
app.get("/orders", (req, res) => {
  pool.query("SELECT *FROM orders", (result) => {
    res.json(result.rows);
  });
});
// Add a new GET endpoint `/orders/:orderId`
app.get("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool.query("SELECT *FROM orders WHERE id=$1", [orderId], (result) => {
    res.json(result.rows);
  });
});
// Add a new GET endpoint `/orders/:orderId`
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT *FROM customers WHERE id=$1",
    [customerId],
    (error, result) => {
      res.json(result.rows);
    }
  );
});

///////////////////////////   TASKS   ////////////////////////////////////////////////////////////

// Task -1 Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("SELECT *FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => console.log(error));
});

//Task-2  Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;

  pool
    .query(
      "INSERT INTO customers(name, address, city,country) VALUES($1,$2,$3,$4)",
      [name, address, city, country]
    )
    .then(() => res.send("New customer added"))
    .catch((error) => console.log(error));
});

//Task-3 Add a new POST endpoint `/products` to create a new product.

app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;
  pool
    .query("INSERT INTO products(product_name) VALUES($1)", [newProductName])
    .then(() => res.send("New product added"))
    .catch((error) => console.log(error));
});

//Task -4 Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id).
//Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error

app.post("/availability", (req, res) => {
  const productId = req.body.prod_id;
  const price = req.body.unit_price;
  const supplierId = req.body.supp_id;

  if (price <= 0 || !supplierId || !productId)
    return res.status(400).send("Please fill al the fields correct!");
  else
    pool
      .query("SELECT *FROM product_availability WHERE prod_id=$1", [productId])
      .then((result) => {
        if (result.rows.length === 0) {
          return res.status(400).json("the product id does not exist!");
        }
      });
  pool
    .query("SELECT *FROM product_availability WHERE supp_id=$1", [supplierId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).json("the supplier id does not exist!");
      }
    });
  pool
    .query(
      "INSERT INTO product_availability(productId, supplierId, price) VALUES($1,$2,$3)",
      [productId, price, supplierId]
    )
    .then(() => res.status(200).json("product is available"))
    .catch((error) => console.log(error));
});
//Task-6 - Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer.
// Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customer_id;
  // const { order_date, order_reference } = req.body;
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  pool
    .query("SELECT *FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        pool
          .query(
            "INSERT INTO orders(customer_id, order_date, order_reference) VALUES($1,$2,$3)",
            [customerId, orderDate, orderReference]
          )
          .then(() => res.status(200).json("new order created"))
          .catch((error) => console.log(error));
      } else {
        return res.status(400).send("customer id does not exist!");
      }
    });
});
//Task 7- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
      [name, address, city, country, customerId]
    )
    .then(() => res.status(200).json(`customer ${customerId} updated`))
    .catch((error) => console.log(error));
});

//Task 8 - Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.status(200).json(`Order id=${orderId} deleted`))
        .catch((error) => console.log(error));
    });
});
//Task 9-  Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("SELECT FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.status(200).json(`Customer ${customerId} deleted`))
          .catch((error) => console.log(error));
      } else {
        res.json("As customer has order(s) can not be deleted!");
      }
    });
});

//Task 10- - Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer.
//Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const query = `SELECT customers.id,orders.order_reference,orders.order_date,products.product_name,product_availability.unit_price,suppliers.supplier_name, order_items.quantity 
  FROM orders 
  INNER JOIN order_items ON orders.id = order_items.order_id 
  INNER JOIN products ON products.id=order_items.product_id 
  INNER JOIN product_availability ON products.id=product_availability.prod_id 
  INNER JOIN suppliers ON suppliers.id=product_availability.supp_id 
  INNER JOIN customers ON customers.id=orders.customer_id 
  WHERE customers.id =$1`;
  pool.query(query, [customerId]).then((result) => {
    res.json(result.rows);
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
