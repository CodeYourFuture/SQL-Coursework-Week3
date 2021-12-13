const { request } = require("express");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT * FROM customers WHERE id = $1",
    [customerId],
    (error, result) => {
      if (error) {
        return response.send(error);
      }
      res.json(result.rows);
    }
  );
});

//Add new customer
app.post("/customers", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  const insertQuery =
    "INSERT INTO customers(name,address,city,country) VALUES($1,$2,$3,$4) RETURNING id;";
  pool.query(
    insertQuery,
    [name, address, city, country],
    (error, result) => {
      if (error) {
        return res.send(error);
      }
      res.send({ id: result.rows[0].id });
    }
  );
});
app.get("/suppliers", (request, response) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    response.send(result.rows);
  });
});

// /products?name=Cup
app.get("/products", (request, response) => {
  const productName = request.query.name;

  const selectQuery = `SELECT product_name,unit_price, supplier_name
                      FROM products
                      INNER JOIN product_availability ON product_availability.prod_id = products.id
                      INNER JOIN suppliers ON product_availability.supp_id  = suppliers.id
                      WHERE product_name ILIKE '%${
                        productName || ""
                      }%' ; `;
  pool.query(selectQuery, (error, result) => {
    if (error) {
      return response.send(error);
    }
    response.send(result.rows);
  });
});

//Add new product
app.post("/products", function (req, res) {
  const product_name = req.body.product_name;
  const insertQuery =
    "INSERT INTO products(product_name) VALUES($1)";
  pool.query(
    insertQuery,
    [product_name],
    (error, result) => {
      if (error) {
        return res.send(error);
      }
      res.send({ msg: "product added" });
    }
  );
});

//  create a new product availability (
app.post("/availability", function (req, res) {
  const prod_id = req.body.prod_id;
  const supp_id = req.body.supp_id;
  const unit_price = +req.body.unit_price;

  if (!prod_id || !supp_id || !unit_price) {
    return res
      .status(400)
      .send("Please enter prod_id, supp_id & unit_price");
  }
  if (unit_price < 0) {
    return res
      .status(400)
      .send("Price should be positive!");
  }
  const insertQuery =
    "INSERT INTO product_availability(prod_id,supp_id,unit_price) VALUES($1,$2,$3)";
  pool.query(
    insertQuery,
    [prod_id, supp_id, unit_price],
    (error, result) => {
      if (error) {
        console.log(error);
        return res.send(error.detail);
      }
      res.send({ msg: "product_availability added" });
    }
  );
});

//to create a new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const order_date = req.body.order_date;
  const order_reference = req.body.order_reference;

  if (!customerId || !order_date || !order_reference) {
    return res
      .status(400)
      .send(
        "Please enter customerId, order_date & order_reference"
      );
  }
  pool.query(
    "SELECT * FROM customers c WHERE c.id =$1",
    [customerId],
    (error, result) => {
      if (error) {
        return res.send(error);
      }
      if (result.rowCount === 0) {
        return res.send({ msg: "customer doesn't exist" });
      }

      pool.query(
        "INSERT INTO orders(order_date, order_reference, customer_id) VALUES($1,$2,$3) RETURNING id;",
        [order_date, order_reference, customerId],
        (error, result) => {
          if (error) {
            return res.send(error);
          }
          res.send({ id: result.rows[0].id });
        }
      );
    }
  );
});

// update an existing customer
app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  const putQuery =
    "UPDATE customers SET name = $2, address = $3,city = $4,country = $5 WHERE id=$1";
  pool.query(
    putQuery,
    [customerId, name, address, city, country],
    (error, result) => {
      if (error) {
        console.log(error);
        return res.send(error);
      }
      if (result.rowCount === 0) {
        return res.send({ msg: "customer doesn't exist" });
      }
      res.send(`Customer ${customerId} updated!`);
    }
  );
});
// DELETE endpoint /orders/:orderId to delete an existing order
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  //delete order_items first
  const deleteQueryForOrderItems =
    "DELETE FROM order_items WHERE order_id = $1";
  pool.query(
    deleteQueryForOrderItems,
    [orderId],
    (error, result) => {
      if (error) {
        console.log(error);
        return res.send(error);
      }
    }
  );
  //delete order
  const deleteQueryForOrders =
    "DELETE FROM orders WHERE id = $1";
  pool.query(
    deleteQueryForOrders,
    [orderId],
    (error, result) => {
      if (error) {
        console.log(error);
        return res.send(error);
      }
      if (result.rowCount === 0) {
        return res.send({ msg: "order doesn't exist" });
      }
      res.send(`Order ${orderId} deleted!`);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Port running on ${PORT}`);
});
