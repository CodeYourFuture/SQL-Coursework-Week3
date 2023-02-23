const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const { Pool } = require("pg");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const db = new Pool({
  user: "kmona", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "0007",
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});
// get all orders

app.get("/orders", function (req, res) {
  db.query("SELECT * FROM orders", (error, result) => {
    res.json(result.rows);
  });
});
//- Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get("/customers/:customerId", function (req, res) {
  const cuName = Number(req.params.customerId);
  db.query(
    `SELECT * FROM customers
     Where id=${cuName}
  `,
    (error, result) => {
      res.json(result.rows);
    }
  );
});
//- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", function (req, res) {
  const customerId = Number(req.params.customerId);
  const newName = req.body.name;
  const newAdress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  db.query(
    `UPDATE  customers SET name=$1,address=$2, city = $3 , country=$4
     Where id=${customerId}
  `,
    [newName, newAdress, newCity, newCountry]
  ).then(() => res.send(`Customer ${customerId} updated!`));
});

//Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const newAdress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, address, city,country) VALUES ($1, $2, $3,$4)";

  db.query(query, [newName, newAdress, newCity, newCountry])
    .then(() => res.send("customer created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

app.delete("/orders/:orderId", (req, res) => {
  const orderID = +req.params.orderId;
  db.query("DELETE FROM order_items WHERE order_id=$1", [orderID])
    .then(() => {
      db.query("DELETE FROM orders WHERE id=$1", [orderID])
        .then(() => res.send(`order ${orderID} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});
//- Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = Number(req.params.customerId);
  const newOrderDate = req.body.order_date;
  const newOrderRef = req.body.order_reference;
  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

  db.query(query, [newOrderDate, newOrderRef, customerId])
    .then(() => res.send(" new order created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//- Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", (req, res) => {
  const custID = +req.params.orderId;
  db.query(
    "DELETE FROM orders WHERE customer_id=$1 and order_reference = Null",
    [custID]
  )
    .then(() => {
      db.query("DELETE FROM customers WHERE id=$1", [custID])
        .then(() => res.send(`customers ${custID} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

//- Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post("/availability", function (req, res) {
  const newProduactID = req.body.prod_id;
  const newnewSupplerID = req.body.supp_id;
  const newProductPrice = req.body.unit_price;

  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

  db.query(query, [newProduactID, newnewSupplerID, newProductPrice])
    .then(() => res.send("new product availability created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
// Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!
app.get("/products", function (req, res) {
  const findByName = req.query.name;
  let query;
  if (findByName) {
    query = `
          Select p.product_name , pa.unit_price  , s.supplier_name from products p 
          join product_availability pa 
          on  p.id =pa.prod_id
          join suppliers s 
          on pa.supp_id = s.id
          where  p.product_name Like '%${findByName}%'
      `;
  }
  query = `
          Select p.product_name , pa.unit_price  , s.supplier_name from products p 
          join product_availability pa 
          on  p.id =pa.prod_id
          join suppliers s 
          on pa.supp_id = s.id
         
      `;
  db.query(query, (error, result) => {
    res.json(result.rows);
  });
});
//- Add a new POST endpoint `/products` to create a new product.
app.post("/products", function (req, res) {
  const newName = req.body.product_name;

  const query = "INSERT INTO products (product_name) VALUES ($1)";

  db.query(query, [newName])
    .then(() => res.send("products created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(9090, () => {
  console.log("hi I'm from node js  9090");
});
