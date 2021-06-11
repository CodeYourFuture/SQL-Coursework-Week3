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

app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;

  if (!newProductName) {
    return res.status(400).send("Product Name is required");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Product exists.");
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

app.listen(3000, () => {
  console.log(" Server running on port 3000");
});
