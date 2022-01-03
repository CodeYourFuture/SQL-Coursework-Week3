const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/", (req, res) => {
  res.send(
    `Welcome to the cyf_ecommerce database. You query about customers, suppliers and products.`
  );
});

app.use('/customers', require('./routes/customers'));
app.use('/products', require('./routes/products'));
app.use('/suppliers', require('./routes/suppliers'));
app.use('/orders', require('./routes/orders'));

// Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;
  const reqNotIncludesAllColumns = !prod_id || !supp_id || !unit_price;
  const reqValuesNotInRightFormat =
    !Number.isInteger(prod_id) ||
    !Number.isInteger(supp_id) ||
    !Number.isInteger(unit_price);

  // check if request includes prod_id, supp_id and unit_price
  if (reqNotIncludesAllColumns) {
    return res
      .status(400)
      .send(`Please make sure adding product id, supplier id and unit price.`);
  } else if (reqValuesNotInRightFormat) {
    // check if req values are in right format
    return res
      .status(400)
      .send(
        `Please make sure adding product id, supplier and unit price in the right format. They should be integer.`
      );
  } else {
    const selectTheSameRowQueryIfExists =
      "SELECT * FROM product_availability WHERE prod_id=$1 AND supp_id=$2";
    // check if the same product with the same product id and supplier id exists
    pool
      .query(selectTheSameRowQueryIfExists, [prod_id, supp_id])
      .then((result) => {
        if (result.rows.length > 0) {
          return res
            .status(400)
            .send(
              `The product id of ${prod_id} and supplier id of ${supp_id} already match for a row in product_availability table. Please make sure that (productId, supplierId) are unique.`
            );
        } else {
          const queryToCheckProdIdExists = "SELECT * FROM products WHERE id=$1";
          // check if prod id is a valid product id in products table
          pool.query(queryToCheckProdIdExists, [prod_id]).then((result) => {
            if (result.rows.length === 0) {
              res
                .status(400)
                .send(
                  `The product id of ${prod_id} does not exists. Please make sure that both product id and supplier id are valid.`
                );
            } else {
              // check if supplier id is a valid id in suppliers
              const queryToCheckSuppIdExists =
                "SELECT * FROM suppliers WHERE id=$1";
              pool.query(queryToCheckSuppIdExists, [supp_id]).then((result) => {
                if (result.rows.length === 0) {
                  res
                    .status(400)
                    .send(
                      `The supplier id of ${supp_id} does not exists. Please make sure that both product id and supplier id are valid.`
                    );
                } else {
                  // insert the data in product_availability table
                  const insertQuery =
                    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES($1, $2, $3)";
                  pool
                    .query(insertQuery, [prod_id, supp_id, unit_price])
                    .then(() => {
                      res.send(`Added to the product_availability table.`);
                    });
                }
              });
            }
          });
        }
      });
  }
});

app.listen(port, function () {
  console.log(`Server is listening on port ${port}. Ready to accept requests!`);
});
