const e = require("express");
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const app = express();
app.use(express.json());
const password = process.env.PASSWORD;
const host = process.env.HOST;
const user = process.env.USER;
const database = process.env.DATABASE;

const dbConfig = {
  host,
  port: 5432,
  user,
  password,
  database,
};
const pool = new Pool(dbConfig);

// psql queries

const allCustomers = `select name from customers`;
let productQuery = `select product_name,supplier_name,unit_price from products 
inner join product_availability on products.id=product_availability.prod_id
inner join suppliers on product_availability.supp_id=suppliers.id`;
const allSuppliers = `select supplier_name from suppliers`;
const allProducts = `select product_name,supplier_name,unit_price from products 
inner join product_availability on products.id=product_availability.prod_id
inner join suppliers on product_availability.supp_id=suppliers.id;
`;

// customers end point

app.get("/customers", (req, res) => {
  pool
    .query(allCustomers)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error));
});

// get customers by id

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(
      `select customers.name, customers.address,customers.city,customers.country from customers where id=$1`,
      [customerId]
    )
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error));
});

// customers post request end point
app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  const createNewCustomer = `insert into customers (name,address,city,country) values($1,$2,$3,$4) `;
  // needs some data validation
  pool
    .query(createNewCustomer, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then((result) => {
      res.send({ msg: "created new customer" });
    })
    .catch((error) => res.status(500).send(error));
});

// customers put end points
app.delete("/customers/:customerId", (req, res) => {
  const id = req.params.customerId;
  const deleteCustomerQuery = `delete from customers where id=$1`;
  pool
    .query(`select * from orders where customer_id=$1`, [id])
    .then((result) => {
      if (result.rows.length > 0) {
        res.status(400).send({ msg: "customer can't be deleted" });
      } else {
        pool
          .query(deleteCustomerQuery, [id])
          .then((result) => res.status(204).send(result.rows))
          .catch((error) => res.status(500).send(error));
      }
    });
});
// suppliers end point

app.get("/suppliers", (req, res) =>
  pool
    .query(allSuppliers)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error))
);

// orders end point

app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const deleteOrderItems = `delete from order_items where order_id=$1`;
  const deleteOrder = `delete from orders where orders.id=$1`;
  pool
    .query(deleteOrderItems, [orderId])
    .then(() => {
      pool
        .query(deleteOrder, [orderId])
        .then(() => res.send({ msg: "order successfully deleted " }))
        .catch((error) => res.status(500).send(error));
    })
    .catch((error) => res.status(500).send(error));
});
// products end point

app.get("/products", (req, res) => {
  const productNameQuery = req.query.name;
  if (productNameQuery) {
    pool
      .query(
        productQuery + " " + `where product_name like '%${productNameQuery}%'`
      )
      .then((result) => {
        res.send(result.rows);
      })
      .catch((error) => res.status(500).send(error));
  } else {
    pool
      .query(allProducts)
      .then((result) => {
        res.send(result.rows);
      })
      .catch((error) => res.status(500).send(error));
  }
});
// products post request
app.post("/products", (req, res) => {
  const product = req.body.name;
  const newProduct = `insert into products (product_name) values($1)`;

  pool
    .query(newProduct, [product])
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error));
});

app.listen(3000, () => console.log("Running on port 3000"));
