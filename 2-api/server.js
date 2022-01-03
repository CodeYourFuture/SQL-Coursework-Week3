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

// return all the suppliers from the database
app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    if (error) {
      console.log(error);
      return res.send(error);
    }
    res.json(result.rows);
  });
});

// return all the product names along with their prices and supplier names
app.get("/products", (req, res) => {
  const productQueryName = req.query.name;
  const queryForAllProducts =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id ORDER BY products.product_name";

  const queryWhereProductNameIsQueryName =
    "SELECT * FROM (SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id ORDER BY products.product_name) AS results WHERE product_name=$1";

  if (productQueryName) {
    pool
      .query(queryWhereProductNameIsQueryName, [productQueryName])
      .then((result) => {
        if (result.rows.length === 0) {
          return res
            .status(200)
            .send(`There is no product with the name of ${productQueryName}.`);
        } else {
          return res.send(result.rows);
        }
      })
      .catch((error) => {
        console.error(error);
        res.send(`Something went wrong`);
      });
  } else {
    pool
      .query(queryForAllProducts)
      .then((result) => {
        return res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(`Something went wrong!`);
      });
  }
});

// POST endpoint `/products` to create a new product.
app.post("/products", (req, res) => {
  const { product_name } = req.body; // get the product name req object with object destructuring
  if (!product_name) {
    // check if the client all the data needed, if not send status 400
    return res
      .status(400)
      .send(
        `Please fill everything in the form including product name, unit price and supplier name.`
      );
  }
  pool
    .query("SELECT * FROM products WHERE product_name=$1", [product_name])
    .then((result) => {
      // if product already in products, send status 400
      if (result.rows.length > 0) {
        res.status(400).send(`This product is already in the products.`);
      } else {
        // if product not in products table add it to the products table with the value sent by the client
        pool
          .query("INSERT INTO products (product_name) VALUES ($1)", [
            product_name,
          ])
          .then(() => {
            res.status(200).send(`The product has been added to the products.`);
          });
      }
    });
});

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

// DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const orderIdExistsQuery = "SELECT EXISTS(SELECT 1 FROM orders WHERE id=$1)";

  // check if the orderId is a valid id in orders table, if not return 400
  pool.query(orderIdExistsQuery, [orderId]).then((result) => {
    if (result.rows[0].exists === false) {
      return res
        .status(400)
        .send(`There is no order with the id of ${orderId} in orders table.`);
    } else {
      // order id is a valid id in orders table so delete orders from order items first(foreign key constraint) and then delete order itself from the orders table
      const deleteOrderIdFromOrdersQuery = "DELETE FROM orders WHERE id=$1";
      const deleteOrdersFromOrderItemsQuery =
        "DELETE FROM order_items WHERE order_id=$1";

      pool.query(deleteOrdersFromOrderItemsQuery, [orderId]).then(() =>
        pool.query(deleteOrderIdFromOrdersQuery, [orderId]).then(() => {
          res.send(
            `Order with the id of ${orderId} and order items related to the order with the id of ${orderId} has been deleted.`
          );
        })
      );
    }
  });
});

app.listen(port, function () {
  console.log(`Server is listening on port ${port}. Ready to accept requests!`);
});
