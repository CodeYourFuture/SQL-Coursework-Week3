const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "14536",
  port: 5432,
});

//  Home Page
app.get("/", (req, res) => {
  res.json("welcome to the server");
});

//  load all the the customers 
app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers",
   (e, result) => {
    if (e) {
      console.log(e);
      return res.send(e);
    }
    res.json(result.rows);
  });
});

//  load all the the products 
app.get("/products", (req, res) => {
  pool.query("SELECT * FROM products", 
  (e, result) => {
    if (e) {
      console.log(e);
      return res.send(e);
    }
    res.json(result.rows);
  });
});

//  load all the the products 
app.get("/products", (req, res) => {
  pool.query("SELECT * FROM products", 
  (e, result) => {
    if (e) {
      console.log(e);
      return res.send(e);
    }
    res.json(result.rows);
  });
});

// GET endpoint `/products` to filter the list of products by name `/products?name=Cup`
app.get("/products", (req, res) => {
  const productByName = req.query.name;
  pool
    .query(
      `SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON pa.supp_id = suppliers.id WHERE p.product_name ILIKE '%${productByName}%'`)
    .catch((e) => console.error(e));
});

// GET endpoint `/customers/:customerId` to load a single customer by ID
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

// POST endpoint `/customers` to create a new customer with name, address, city and country
app.post("/customers", (req, res) => {
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
    return res.status(400).send("Please Complete all the required");
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1 AND address=$2 ", [
      newCustomerName,
      newCustomerAddress,
    ])
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
          .then(() => res.send("customer created!"))
          .catch((e) => console.error(e));
      }
    });
});

// POST endpoint `/products` to create a new product
app.post("/products", (req, res) => {
  const newProductsName = req.body.product_name;

  if (!newProductsName) {
    return res.status(400).send("Please Complete all the required");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1 ", [newProductsName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductsName])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

// POST endpoint `/availability` to create a new product availability
app.post("/availability", (req, res) => {
  const newSupplierId = req.body.supplierId;
  const newUnitPrice = req.body.unitPrice;
  const newProductId = req.body.productId;

  if (!Number.isInteger(newUnitPrice > 0) || !newSupplierId || !newProductId) {
    return res
      .status(400)
      .send(
        "Please Complete all the required and the price should be a positive integer."
      );
  }

  pool
    .query(
      "SELECT p.id, s.id FROM products p, suppliers s WHERE p.id=$1 AND s.id=$2",
      [newProductId, newSupplierId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send(" ID with the same name already exists!");
      } else {
        const query =
          "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newSupplierId, newUnitPrice, newProductId])
          .then(() => res.send("Hotel created!"))
          .catch((e) => console.error(e));
      }
    });
});

// POST endpoint `/customers/:customerId/orders` to create a new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customer_id;
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        pool
          .query(
            "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
            [orderDate, orderReference, customerId]
          )
          .then(() => res.status(200).json("new order created"))
          .catch((error) => console.log(error));
      } else {
        return res.status(400).send("customer id does not exist!");
      }
    });
});

// PUT endpoint `/customers/:customerId` to update an existing customer
app.put("/customers/:customerId", (req, res) => {
  const id = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool.query("SELECT * FROM customers WHERE id=$1", [id]).then((result) => {
    if (result.rows.length === 0) {
      return res.status(400).send(`We couldn't find customer with ID ${id}!`);
    } else {
      const query =
        "UPDATE customers SET name=$2, address=$3, city=$4, country=$5 WHERE  id=$1";
      pool
        .query(query, [id, name, address, city, country])
        .then(() => res.send("Customer Updated!!!"))
        .catch((e) => console.error(e));
    }
  });
});

// DELETE endpoint `/orders/:orderId` to delete an existing order along
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  pool.query("DELETE FROM order_items WHERE order_id = $1", [orderId]).then((result) => {
    if (result.rows.length === 0) {
      return res
        .status(400)
        .send(`We couldn't find ID ${orderId}!`);
    } else {
      const query = "DELETE FROM orders WHERE id = $1";
      pool
        .query(query, [orderId])
        .then(() => res.send("Order Deleted!!!"))
        .catch((e) => console.error(e));
    }
  });
});

// DELETE endpoint `/customers/:customerId` to delete an existing customer
app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .send(`We couldn't find customer with ID ${customerId}!`);
      } else {
        const query = "DELETE FROM customers WHERE id = $1";
        pool
          .query(query, [customerId])
          .then(() => res.send("customer Deleted!!!"))
          .catch((e) => console.error(e));
      }
    });
});

// GET endpoint `/customers/:customerId/orders` to load all the orders
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query(
      "SELECT b.checkin_date, b.nights, h.name, h.postcode FROM bookings b INNER JOIN hotels h on h.id= b.hotel_id INNER JOIN customers f on f.id=b.customer_id WHERE f.id=$1",
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
