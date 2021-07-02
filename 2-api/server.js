const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const pool = new Pool({
  user: "negin",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", (req, res) => {
  pool.query("SElECT * FROM customers", (error, result) => {
    console.log(result.rows);
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.id;
  pool
    .query("SELECT * FROM customers Where id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => console.error(error));
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", (req, res) => {
  const productNameQuery = req.query.name;
  let query =
    "SELECT product_name, unit_price, supplier_name FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id";
  if (productNameQuery) {
    query = `SELECT product_name, unit_price, supplier_name FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id WHERE product_name LIKE '%${productNameQuery}%'`;
  }
  pool
    .query(query)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => console.log(error));
});

app.post("/products", (req, res) => {
  const { product_name } = req.body;
  let query = "SELECT * FROM products WHERE product_name=$1";

  pool.query(query, [product_name]).then((result) => {
    if (result.rows.length > 0) {
      return res.status(500).send("Product already exist!");
    } else {
      query = "INSERT INTO products(product_name) VALUES ($1)";
    }
    pool
      .query(query, [product_name])
      .then(() => res.send("product Added"))
      .catch((error) => console.error(error));
  });
});

app.post("/customers", (req, res) => {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  const query =
    "INSERT INTO customers(name, address, city, country) VALUES ($1, $2, $3, $4)";
  pool
    .query(query, [newName, newAddress, newCity, newCountry])
    .then(() => res.send("Customer Added"))
    .catch((error) => console.error(error));
});

app.post("/availability", (req, res) => {
  const { supplierId, unitPrice, productId } = req.body;
  if (!supplierId || !productId || !unitPrice || unitPrice < 0) {
    return res.status(400).send("Please enter valid data!");
  }

  pool
    .query("SELECT * FROM products WHERE id=$1", [productId])
    .then((result) => {
      if (result.rows.length != 0) {
        pool
          .query("SELECT * FROM suppliers WHERE id=$1", [supplierId])
          .then((result) => {
            if (result.rows.length != 0) {
              pool
                .query(
                  "select * from product_availability where prod_id =$1 and supp_id =$2;",
                  [productId, supplierId]
                )
                .then((result) => {
                  if (result.rows.length > 0) {
                    return res
                      .status(400)
                      .send("This product availability alreay exists!");
                  } else {
                    const query =
                      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);";
                    pool
                      .query(query, [productId, supplierId, unitPrice])
                      .then(() => res.send("Product Created!"))
                      .catch((e) => console.error(e));
                  }
                });
            } else {
              return res.status(400).send("The supplier does not exists!");
            }
          });
      } else {
        return res.status(400).send("The supplier does not exists!");
      }
    });
});

app.put("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  const { name, address, city, country } = req.body;

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
      [name, address, city, country, customerId]
    )
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000!");
});
