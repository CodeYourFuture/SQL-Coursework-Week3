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

// postgres queries

const allCustomers = `select name,address,city,country from customers`;
let productQuery = `select product_name,supplier_name,unit_price from products 
inner join product_availability on products.id=product_availability.prod_id
inner join suppliers on product_availability.supp_id=suppliers.id`;
const allSuppliers = `select supplier_name from suppliers`;
const allProducts = `select product_name,supplier_name,unit_price from products 
inner join product_availability on products.id=product_availability.prod_id
inner join suppliers on product_availability.supp_id=suppliers.id;
`;
const allOrders = `SELECT order_reference, product_name, unit_price, supplier_name, quantity,order_date
FROM orders 
INNER JOIN order_items ON orders.id = order_items.order_id
INNER JOIN products ON products.id = order_items.product_id
INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id AND product_availability.supp_id = order_items.supplier_id
INNER JOIN suppliers ON suppliers.id = product_availability.supp_id
WHERE customer_id=$1`;

// start of customers end points

app.get("/customers", (req, res) => {
  pool
    .query(allCustomers)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error));
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(
      `select customers.name, customers.address,customers.city,customers.country from customers where id=$1`,
      [customerId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        res.send(result.rows);
      } else {
        res.send({ msg: `customer with ${customerId} does not exist` });
      }
    })
    .catch((error) => res.status(500).send(error));
});

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
      if (
        newCustomerAddress &&
        newCustomerCity &&
        newCustomerCountry &&
        newCustomerName
      ) {
        res.send({ msg: "created new customer" });
      } else {
        res.send({ msg: "please fill in all details " });
      }
    })
    .catch((error) => res.status(500).send(error));
});

app.get("/customers/:customerId/orders", async function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(`select * from customers where id=$1`, [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        res.send({ msg: "customer does not exist" });
      } else {
        pool
          .query(allOrders, [customerId])
          .then((result) => res.json(result.rows))
          .catch((error) => res.status(500).send(error));
      }
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  pool
    .query(`select * from customers where id=$1`, [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(400).send({ msg: "customer does not exist" });
      } else {
        pool
          .query(
            "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
            [newOrderDate, newOrderReference, customerId]
          )
          .then((result) => {
            res.send({ msg: "created new order" });
          });
      }
    })
    .catch((error) => res.status(500).send(error));
});
app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    newCustomerName &&
    newCustomerAddress &&
    newCustomerCity &&
    newCustomerCountry
  ) {
    pool
      .query("select id from customers where id=$1", [customerId])
      .then((result) => {
        if (result.rowCount > 0) {
          pool
            .query(
              "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5;",
              [
                newCustomerName,
                newCustomerAddress,
                newCustomerCity,
                newCustomerCountry,
                customerId,
              ]
            )
            .then(() =>
              res.send(`Customer ${customerId} successfully updated!.`)
            )
            .catch((e) => console.error(e));
        } else {
          res.status(400).send({ msg: "customer does not exist" });
        }
      })
      .catch((error) => res.send(error));
  } else {
    res.status(400).send("fill in all customer entries");
  }
});
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

app.post("/products", (req, res) => {
  const product = req.body.product_name;
  const newProduct = `insert into products (product_name) values($1)`;
  pool
    .query(newProduct, [product])
    .then(() => {
      res.status(201).send({ msg: "successfully created new product" });
    })
    .catch((error) => res.status(500).send(error));
});
app.post("/availability", (req, res) => {
  const newProductId = req.body.prod_id;
  const newSupplierId = req.body.supp_id;
  const newUnitPrice = parseFloat(req.body.unit_price);
  if (!newProductId || !newSupplierId || !newUnitPrice) {
    if (newUnitPrice <= 0) {
      res
        .status(400)
        .send({ msg: "unite price can not be zero or negative value" });
    }
    res.status(400).send({ msg: "fill in all fields" });
  }
  pool
    .query("SELECT id FROM products WHERE id=$1", [newProductId])
    .then((result) => {
      if (result.rowCount > 0) {
        pool
          .query("SELECT id FROM suppliers WHERE id=$1", [newSupplierId])
          .then((result) => {
            if (result.rowCount > 0) {
              pool
                .query(
                  "SELECT unit_price FROM product_availability WHERE prod_id=$1 AND supp_id=$2",
                  [newProductId, newSupplierId]
                )
                .then((result) => {
                  if (result.rowCount > 0) {
                    res.status(404).send({
                      msg: "product and supplier already exists ",
                    });
                  }
                  pool
                    .query(
                      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);",
                      [newProductId, newSupplierId, newUnitPrice]
                    )
                    .then(() =>
                      res.send("Product Availability Created successfully")
                    )
                    .catch((error) => res.send(error));
                })
                .catch((error) => res.send(error));
            } else {
              res
                .status(404)
                .send({ msg: "please check supplier id is valid" });
            }
          })
          .catch((error) => res.send(error));
      } else {
        res.status(404).send({ msg: "please check product id is valid" });
      }
    })
    .catch((error) => res.send(error));
});

app.listen(3000, () => console.log("Running on port 3000"));
