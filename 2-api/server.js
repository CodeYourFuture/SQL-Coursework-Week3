const express = require("express");
const {Pool} = require("pg");
const app = express();
const dbConfig = {
  host: "localhost",
  port: 5432,
  user: "DELL",
  password: "87654321",
  database: "cyf_ecommerce",
};
const pool = new Pool(dbConfig);

const customerSelectQuery = `SELECT * FROM customers `;
const customerSelectByIdQuery = `SELECT * FROM customers WHERE id = $1`;
const suppliersSelectQuery = `SELECT * FROM suppliers `;
const productsSelectQuery = `SELECT product_name,supplier_name,unit_price FROM products 
INNER JOIN product_availability on products.id=product_availability.prod_id
INNER JOIN suppliers on product_availability.supp_id=suppliers.id;
`;

// Validators

function isValidID(id) {
  return !isNaN(id) && id >= 0;
}

// end point
app.get("/suppliers", async (req, res) => {
  try {
    const result = await pool.query(suppliersSelectQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(productsSelectQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Customers
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query(customerSelectQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/customers/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (!isValidID(id)) {
    res.status(404).send({Msg: "Customer not found"});
  } else {
    pool
      .query(customerSelectByIdQuery, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          res.status(404).send({Msg: "Customer not found"});
        } else {
          res.send(result.rows[0]);
        }
      })
      .catch((error) => res.status(500).send(error));
  }
});

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
    return res.status(400).send("All fields are required.");
  }

  const query =
    "INSERT INTO hotels (name, address, city, country) VALUES ($1, $2, $3)";
  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => res.send("Customer created!"))
    .catch((e) => console.error(e));
});

app.listen(3000, () => {
  console.log(" Server running on port 3000");
});
