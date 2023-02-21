const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const { query } = require("express");

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

const db = new Pool({
  user: "postgres", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "zision",
  port: 5432,
});

app.get("/customers", function (req, res) {
  //    console.log(res.send("hello"))
  db.query("SELECT * FROM customers", (error, result) => {
    // console.log(result)
    res.json(result.rows);
  });
});

app.get("/orders", function (req, res) {
  //    console.log(res.send("hello"))
  db.query("SELECT * FROM orders", (error, result) => {
    // console.log(result)
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  var custId = parseInt(req.params.customerId);
  db.query("SELECT * FROM customers WHERE id = $1", [custId], (err, result) => {
    res.json(result.rows);
  });
});

app.post("/customers", function (request, response) {
  // name, address, city and country.

  const newName = request.body.name;
  const newAddress = request.body.address;
  const newCity = request.body.city;
  const newCountry = request.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) " +
    "values ($1, $2, $3, $4)";
  db.query(query, [newName, newAddress, newCity, newCountry], (err) => {
    response.send("customer created");
  });
});

// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.post("customers/:customersId/orders", function (request, response) {
  const custId = parseInt(request.params.customersId);
  // const newOrderId = request.body.id;
  const newOrderDate = request.body.order_date;
  const newOrderRef = request.body.order_reference;

  if (!newOrderDate || !newOrderRef || !custId) {
    return response.status(400).send("Missing required field(s).");
  }

  const checkCustomerQuery = "SELECT * FROM customers WHERE id = $1";
  db.query(checkCustomerQuery, [custId], (err, result) => {
    if (err) {
      console.error(err);
      return response.status(500).send("Error checking customer ID.");
    }
    const customerCount = result.rows[0].count;
    if (customerCount === 0) {
      return response.status(400).send("Invalid customer ID.");
    }

    const query =
      "INSERT INTO orders (order_date, order_reference, custId) " +
      "VALUES ($1, $2, $3)";

    db.query(query, [newOrderDate, newOrderRef, custId], (err, result) => {
      if (err) {
        console.error(err);
        return response.status(500).send("Error creating order.");
      }
      response.status(200).send("New order created.");
    });
  });
});

// Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).

app.put("/customers/:id", function (request, response) {
  const customerId = parseInt(request.params.id);
  const newName = request.body.name;
  const newAddress = request.body.address;
  const newCity = request.body.city;
  const newCountry = request.body.country;
  db.query(
    "UPDATE customers SET name=$2, address= $3, city=$4,  country=$5 where id =$1",
    [customerId, newName, newAddress, newCity, newCountry]
  )
    .then(() => response.send(`Customer ${customerId} updated!`))
    .catch((err) => {
      console.error(err);
      response.status(500).json({ error: err });
    });
});

// Add a new DELETE endpoint /customers/:customerId to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", function (request, response) {
  const customerId = parseInt(request.params.customerId);

  db.query(
    "SELECT COUNT(*) FROM orders WHERE customer_id = $1",
    [customerId],
    (err, result) => {
      if (err) {
        console.error(err);
        return response.status(500).send("Error checking for customer orders.");
      }

      const orderCount = result.rows[0].count;
      if (orderCount > 0) {
        return response.status(400).send("Customer has already placed orders.");
      }
      db.query(
        "DELETE FROM customers WHERE id = $1",
        [customerId],
        (err, result) => {
          if (err) {
            console.error(err);
            return response.status(500).send("Error deleting customer.");
          }
          response.status(200).send("Customer deleted.");
        }
      );
    }
  );
});

// endpoint = products

app.get("/products", function (req, res) {
  //    console.log(res.send("hello"))
  db.query(
    "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id",
    (error, result) => {
      // console.log(result)
      res.json(result.rows);
    }
  );
});

app.get("/products/name", function (req, res) {
  //    console.log(res.send("hello"))
  const productName = req.params.name;
  if (productName) {
    db.query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id WHERE lower (products.product_name) = [`%{productName}%`]",
      (error, result) => {
        // console.log(result)
        res.json(result.rows);
      }
    );
  } else {
    db.query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id",
      (error, result) => {
        res.json(result.rows);
      }
    );
  }
});
