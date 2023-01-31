const express = require("express");
const app = express();
app.use(express.json());
const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

const db = new Pool({
  user: process.env.DB_USER,
  host: "localhost",
  database: "cyf_ecommerce",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/products", function (req, res) {
  const productName = req.query.name;
  let query = `SELECT p.product_name, pa.unit_price, s.supplier_name 
    FROM products AS p JOIN product_availability AS pa ON p.id = pa.prod_id 
    JOIN suppliers AS s ON pa.supp_id = s.id`;
  let params = [];
  if (productName) {
    query = `SELECT p.product_name, pa.unit_price, s.supplier_name 
        FROM products AS p JOIN product_availability AS pa ON p.id = pa.prod_id 
        JOIN suppliers AS s ON pa.supp_id = s.id 
        WHERE lower(p.product_name) LIKE $1`;
    params.push(`%${productName}%`);
  }
  db.query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//GET customers by ID
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  db.query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//ADD new customers
app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  db.query("SELECT * FROM customers WHERE name = $1", [newName]).then(
    (result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name,address,city,country) VALUES ($1, $2, $3, $4)";
        db.query(query, [newName, newAddress, newCity, newCountry])
          .then(() => res.send("Customer added successfully!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    }
  );
});

app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;

  db.query("SELECT * FROM products WHERE product_name = $1", [
    newProductName,
  ]).then((result) => {
    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("An product with the same name already exists!");
    } else {
      const query = "INSERT INTO products (product_name) VALUES ($1)";
      db.query(query, [newProductName])
        .then(() => res.send("Product added successfully!"))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    }
  });
});

app.post("/availability", (req, res) => {
  const productID = req.body.prod_id;
  const supplierID = req.body.supp_id;
  const newPrice = req.body.unit_price;
  if (!Number.isInteger(newPrice) || newPrice <= 0) {
    return res.status(400).send("The price should be a positive integer.");
  }
  db.query("SELECT * FROM products WHERE id=$1", [productID]).then((result) => {
    if (result.rows.length === 0) {
      return res.status(400).send("An product id does not exist!");
    }
    db.query("SELECT * FROM suppliers WHERE id=$1", [supplierID]).then(
      (result) => {
        if (result.rows.length === 0) {
          return res.status(400).send("An supplier id does not exist!");
        }
        db.query(
          "SELECT * FROM product_availability WHERE prod_id=$1 AND supp_id=$2",
          [productID, supplierID]
        ).then((result) => {
          if (result.rows.length > 0) {
            return res.status(400).send("This availability already exists.");
          }
          const query =
            "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
          db.query(query, [productID, supplierID, newPrice])
            .then(() => res.send("Availability created!"))
            .catch((error) => {
              console.error(error);
              res.status(500).send(error);
            });
        });
      }
    );
  });
});

app.post("/customers/:customerId/orders",(req,res)=>{
  const customerId = req.params.customerId;
  const orderDate = req.body.order_date;
  const orderRef = req.body.order_reference;
  db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then(
    (result) => {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .send("An customer does not exist!");
      } else {
        const query =
          "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1, $2, $3)";
        db.query(query, [orderDate, orderRef, customerId])
          .then(() => res.send("orders added successfully!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    }
  );
})

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  db
    .query("UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5", [newName,newAddress,newCity,newCountry, customerId])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  db.query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => res.send(`order ${orderId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  db.then(() => db.query("DELETE FROM customers WHERE id=$1", [customerId]))
    .then(() => res.send(`Customer ${customerId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  const query = `SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, i.quantity
               FROM orders o
               INNER JOIN order_items i
               ON o.id = i.order_id
               INNER JOIN products p
               ON i.product_id = p.id
               INNER JOIN suppliers s
               ON i.supplier_id = s.id
               INNER JOIN product_availability pa
               ON i.product_id = pa.prod_id AND i.supplier_id = pa.supp_id
               WHERE o.customer_id = $1`;

  db.query(query, [customerId])
     .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
