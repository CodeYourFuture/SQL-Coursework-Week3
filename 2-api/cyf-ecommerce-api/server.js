const express = require("express");

const app = express();
const { Pool } = require("pg");

const PORT = process.env.PORT || 4000;

const pool = CreateNew Pool({
  user: "Konikalily",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.json("Welcome to the CYF postgresql server!");
});

// return all the customers from the database
app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers", (db_error, db_result) => {
    if (db_error) {
      //console.log(db_error);
      return res.send(db_error);
    } else {
      console.log(db_result);
      res.json(db_result.rows);
    }
  });
});

// Add a CreateNew GET endpoint `/suppliers` to return all the suppliers from the database

app.get("/suppliers", (req, res) => {
  const { name } = req.query;
  pool.query("SELECT * FROM suppliers", (db_error, db_result) => {
    if (db_error) {
      res.send(db_error);
    } else {
      // console.log(db_result);
      res.json(db_result.rows);
    }
  });
});

//task1--Add a GET endpoint `/products` to return all the product names along with their prices and supplier names with search functionality.

app.get("/products", (req, res) => {
  const allProducts = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products 
              INNER JOIN product_availability 
              ON products.id = product_availability.prod_id 
              INNER JOIN suppliers 
              ON suppliers.id = product_availability.supp_id;`;
  const searchRequestBy = req.query.name;

  if (searchRequestBy) {
    pool.query(
      `${allProducts} WHERE product_name ~* '${searchRequestBy}'`,
      (db_error, db_result) => {
        res.json(db_result.rows);
      }
    );
  } else {
    pool.query(allProducts, (db_error, db_result) => {
      res.json(db_result.rows);
    });
  }
});

// Task-2-Add a CreateNew GET endpoint /customers/:customerId to load a single customer by ID.
app.get("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  pool.query(
    `SELECT * FROM customers WHERE id=${customerId}`,
    (db_error, db_result) => {
      if (db_error) {
        res.send(db_error);
      } else {
        res.json(db_result.rows);
      }
    }
  );
});

//Task-3- Add a CreateNew POST endpoint /customers to create a new customer with name, address, city and country.
app.post("/customers", (req, res) => {
  const CreateNewCustomerName = req.body.name;
  const CreateNewCustomerAddress = req.body.address;
  const CreateNewCustomerCity = req.body.city;
  const CreateNewCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [CreateNewCustomerName])
    .then((db_result) => {
      if (db_result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer name with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)";
        pool
          .query(query, [
            CreateNewCustomerName,
            CreateNewCustomerAddress,
            CreateNewCustomerCity,
            CreateNewCustomerCountry,
          ])
          .then(() => res.send("New Customer created"))
          .catch((db_error) => console.log(db_error));
      }
    });
});
// Task-5-Add a new POST endpoint /products to create a new product.
app.post("/products", (req, res) => {
    const CreateNewProductName = req.body.product_name;

    pool
        .query("SELECT * FROM products WHERE product_name=$1", [CreateNewProductName])
        .then((db_result) => {
            if (db_result.rows.length > 1) {
                return res.status(400).send("Warning!! Repetition !! A product name with the same name already exists!");
            } else {
                const query = "INSERT INTO products (product_name) VALUES ($1)";
                pool
                    .query(query, [CreateNewProductName])
                    .then(() => res.send("A New product is created"))
                    .catch((db_error) => console.log(db_error));
            }
        });
});
//Task-6-// Add a new POST endpoint /availability to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", (req, res) => {
    const createNewProductId = req.body.prod_id;
    const createNewProductPrice = req.body.unit_price;
    const createNewSupplierId = req.body.supp_id;

    if (!Number.isInteger(createNewProductPrice) || CreateNewProductPrice <= 0) {
        return res.status(400).send("Your Unit price should be positive number");
    }

    if (!CreateNewProductId || !createNewSupplierId) {
        return res.status(400).send("Product Id or Supplier Id missing");
    }

    pool
        .query("SELECT * FROM product_availability WHERE prod_id = $1", [createNewProductId])
        .then((db_result) => {
            if (db_result.rows.length === 0) {
                return res.status(400).json("This product does not exist!");
            } else if (db_result.rows.length > 0) {
                pool
                    .query("SELECT * FROM product_availability WHERE supp_id = $1", [createNewSupplierId])
                    .then((db_result) => {
                        if (db_result.rows.length === 0) {
                            return res.status(400).send("The supplier ID does not exist!");
                        } else {
                            const query = "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
                            pool
                                .query(query, [createNewProductId, createNewSupplierId, createNewProductPrice])
                                .then(() => res.send("New product availability is created"))
                                .catch((db_error) => console.error(db_error));
                        }
                    })
                    .catch((db_error) => console.log(db_error));
            }
        })
    .catch((db_error) => console.log(db_error))
})
//Task -7-// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;
    const orderDate = req.body.order_date;
    const orderReference = req.body.order_reference;

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((db_result) => {
            if (db_result.rows.length > 0) {
                const query = "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
                pool
                    .query(query, [orderDate, orderReference, customerId])
                    .then(() => res.send("A new order is created"))
                    .catch((db_error) => console.log(db_error));
            } else {
                return res.status(400).send("Customer Id doesn't exist");
            }
        })
        .catch((db_error) => console.log(db_error));
});

//Task -8- Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;


    pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((db_result) => {
        if (db_result.rows.length > 0) {
            const query = "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
            pool
                .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry, customerId])
                .then(() => {
                    res.send(`Customer ${customerId} updated!`);
                })
                .catch((db_error) => console.log(db_error));
        } else {
            return res.status(400).send("The customer Id doesn't exist");
        }
    });
});

//task- 9-Add a new DELETE endpoint /orders/:orderId to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool.query(
        "DELETE FROM orders WHERE id=$1",
        [orderId],
        (db_error, db_result) => {
          if (!db_error) {
            res
              .status(200)
              .send("Order deleted successfully")
              .json(db_result.rows);
          } else {
            res.status(400).send("Unable to delete order");
            console.error(db_error);
          }
        }
      );
    });
});

//task 10-Add a new DELETE endpoint /orders/:orderId to delete an existing order along with all the associated order items.

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM orders WHERE customer_id =$1", [customerId])
    .then((db_result) => {
      if (db_result.rowCount !== 0) {
        res
          .status(400)
          .send("Sorry cannot delete customer with ongoing orders");
      } else {
        pool
          .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
          .then(() => {
            pool.query(
              "DELETE FROM customers WHERE id=$1",
              [customerId],
              (db_error, db_result) => {
                if (!db_error) {
                  res
                    .status(200)
                    .send("Success! Customer deleted")
                    .json(db_result.rows);
                } else {
                  res.status(400).send("Unable to process request");
                  console.error(db_error);
                }
              }
            );
          });
      }
    });
});

//Task-11-Add a new GET endpoint /customers/:customerId/orders to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

app.get("/customers/:customerId/orders", (req, res) => {
    const { customerId } = req.params;
    const query = `SELECT c.id, o.order_reference, o.order_date, p.product_name, p_a.unit_price, sup.supplier_name, o_i.quantity FROM order_items as o_i
    INNER JOIN orders as o ON o.id = o_i.order_id
    INNER JOIN products as p ON p.id = o_i.product_id
    INNER JOIN product_availability as p_a ON p_a.supp_id = o_i.supplier_id
    INNER JOIN suppliers as sup ON sup.id = o_i.supplier_id
    INNER JOIN customers as c ON c.id = o.customer_id
    WHERE c.id = $1
    ORDER BY o.order_reference ASC`;

    pool.query(query, [customerId], (db_error, db_result) => {
        if (db_error) {
            return res.send(db_error);
        }
        return res.json(db_result.rows);
    });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
