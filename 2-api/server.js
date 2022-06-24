const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

//This will create new pool with configuration
const pool = new Pool({
  user: "amarachi",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "1Natasha+",
  port: 5432,
});
//to return all customers
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//to return all suppliers
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//to return all the product names along with their prices and supplier names.
const productSelect =
  "SELECT products.product_name,suppliers.supplier_name,product_availability.unit_price" +
  " FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id" +
  " INNER JOIN suppliers ON suppliers.id =  product_availability.supp_id";

app.get("/products", function (req, res) {
  const productNameQuery = req.query.name;
  let filterClause = "";
  let params = [];
  if (productNameQuery) {
    filterClause = "WHERE product_name LIKE $1 ORDER BY product_name";
    params.push(`%${productNameQuery}%`);
  }
  const actualQuery = `${productSelect} ${filterClause}`;
  console.log(actualQuery);
  console.log(filterClause);
  pool
    .query(actualQuery, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//This will get one customer by id
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//This will create a new customer
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

//This will create a new product
app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;

  const query = "INSERT INTO products (product_name)  VALUES ($1)";
  pool
    .query(query, [newProductName])
    .then(() => res.send("Product created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/availability", function (req, res) {
  pool
    .query("SELECT * FROM product_availability")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/availability", function (req, res) {
  const newUnit_price = req.body.unit_price;
  const newSupp_id = req.body.supp_id;
  const newProd_id = req.body.prod_id;

  if (newUnit_price < 0) {
    res.status(404).send("Unit Price must be an integer");
  }

  pool
    .query(
      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
      [newProd_id, newSupp_id, newUnit_price]
    )
    .then(() => res.send("Product created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//To create new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  pool
    .query(`SELECT customers.id FROM customers WHERE id=${customerId}`, [
      customerId,
      newOrderDate,
      newOrderReference,
    ])
    .then((result) => {
      if (result.rows === 0) {
        res.send("This customer doesn't exist");
      } else {
        pool
          .query(
            "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1,$2,$3)",
            [newOrderDate, newOrderReference, customerId]
          )
          .then(() => {
            res.send("New order is created");
          })
          .catch((error) => {
            res.status(500).json(error);
          });
      }
    });
});

//To update customers
app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  const setQuery = "name= $1, address= $2, city= $3, country=$4";
  pool
    .query(`UPDATE customers  SET ${setQuery} WHERE id= $5`, [
      name,
      address,
      city,
      country,
      customerId,
    ])
    .then(() => {
      res.send("customer details is updated");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//Delete existing order
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool.query("DELETE FROM orders WHERE id=$1", [orderId]).then(() => {
        res.send(`The order with the order id of ${orderId} has been deleted`);
        res.send("order is deleted");
      });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//to delete an existing customer only if this customer doesn't have orders
app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(`SELECT * FROM orders WHERE customer_id=${customerId}`)
    .then((result) => {
      if (result.rows.length > 0) {
        res.status(404).send("This customer has order so, it can't be deleted");
      } else {
        pool
          .query(`DELETE FROM customers where id=${customerId}`)
          .then(() => {
            res.send(`The customer with id ${customerId} is deleted`);
          })
          .catch((error) => {
            res.status(500).json(error);
          });
      }
    });
});

//to load all the orders along with the items in the orders of a specific customer
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  let query =
    "SELECT orders.id,order_date,order_reference,unit_price,quantity,product_name,supplier_name FROM ";
  ("orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON ");
  ("order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id ");
  ("INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1");
  pool
    .query(query, [customerId])
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

app.listen(4000, function () {
  console.log("Server is listening on port 4000. Ready to accept requests!");
});
