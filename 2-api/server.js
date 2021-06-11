const express = require("express");
const { Pool } = require("pg");
const app = express();
app.use(express.json());

const dbConfig = {
  host: "localhost",
  port: 5432,
  user: "LT", // when run from local, change to your computer username
  password: "wIsE_888", // with your computer password
  database: "cyf_ecommerce",
};
const pool = new Pool(dbConfig);

// Queries (GET)
// get all customers data
const customersSelectQuery = `
SELECT * 
FROM customers`;

// get customer by customer id
const customerSelectByIdQuery = `
SELECT * 
FROM customers 
WHERE id = $1`;

// get all suppliers data
const suppliersSelectQuery = `
SELECT * 
FROM suppliers`;

// get all product names, their prices and suppliers names
const productsSelectQuery = `
SELECT a.product_name,
    c.unit_price,
    supplier_name
FROM products AS a
    INNER JOIN order_items AS b ON a.id = b.product_id
    INNER JOIN product_availability AS c ON b.product_id = c.prod_id
    INNER JOIN suppliers AS d ON b.supplier_id = d.id`;

// Validator function
function isValidID(id) {
  return !isNaN(id) && id >= 0;
}

/* End Points (GET) */
// customers data
app.get("/customers", (req, res) =>
  pool
    .query(customersSelectQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error))
);

app.get("/customers/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (!isValidID(id)) {
    res.status(404).send({ message: "customer not found" });
  } else {
    pool
      .query(customerSelectByIdQuery, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          res.status(404).send({ message: "customer not found" });
        } else {
          res.send(result.rows[0]);
        }
      })
      .catch((error) => res.status(500).send(error));
  }
});

// suppliers data
app.get("/suppliers", (req, res) =>
  pool
    .query(suppliersSelectQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error))
);

// products data
app.get("/products", (req, res) =>
  pool
    .query(productsSelectQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error))
);

app.get("/products?name=Cup", (req, res) =>
  pool
    .query(productsSelectQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error))
);

/* (POST) */
// customer
app.post("/customers/", (req, res) => {
  const customerInsertQuery = `
    INSERT INTO customers (name, address, city, country)
    VALUES ($1, $2, $3, $4)
    RETURNING id`;

  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  if (!name || !address || !city || !country) {
    res.status(400).send({ message: "Error input" });
  } else {
    pool
      .query(customerInsertQuery, [name, address, city, country])
      .then((result) => res.status(201).send(result.rows[0]))
      .catch((error) => res.status(500).send(error));
  }
});

// product
app.post("/products/", (req, res) => {
  const productInsertQuery = `
    INSERT INTO products (product_name)
    VALUES ($1)
    RETURNING id`;

  const product_name = req.body.product_name;

  if (!product_name) {
    res.status(400).send({ message: "Error input" });
  } else {
    pool
      .query(productInsertQuery, [product_name])
      .then((result) => res.status(201).send(result.rows[0]))
      .catch((error) => res.status(500).send(error));
  }
});

/* DELETE */
app.delete("/customers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    const orderQuery = `
    SELECT *
    FROM orders
    WHERE customer_id=$1`;

    const deleteCustomerQuery = `
    DELETE FROM customers
    WHERE id=$1`;

    pool
        .query(orderQuery, [id])
        .then((result) => {
            if (result.rows.length > 0) {
                res.status(400).send({message: "cannot delete"});
            } else {
                pool
                    .query(deleteCustomerQuery, [id])
                    .then((result) => res.status(204).send(result.rows))
                    .catch((error) => res.status(500).send(error));
            }
        })
})

app.listen(5000, () => console.log("Running on port 5000"));
