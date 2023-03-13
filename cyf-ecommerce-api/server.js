const express = require("express");
const app = express();
const {Pool} = require("pg");

const port = process.env.PORT || 4001;

const pool = new Pool({
  user: 'ptgs',
  host: 'dpg-cg0qgb7dvk4ovd26hei0-a.oregon-postgres.render.com',
  database: 'cyfdbcourse',
  password: '2CY6mAb7GKWpWb1Rq49MIweALl1Zsb5m',
  port: 5432
  , ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());

app.get('/', (req, res) =>{
  console.log('well done')
  res.status(200).send('Welcome to our product site')
})

//GET 
app.get("/products", (req, res) => {
  pool.query('SELECT * FROM products')
  .then((result) =>{res.status(200).json(result.rows)})
  .catch((error) =>{
    console.error(error)
    res.status(500).json(error)
  })
  
});

//GET PARAMS QUERY

app.get("/customers/:customerId", function (req, res) {
  const custmrId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [custmrId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// // post

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.customer_name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE customer_name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (customer_name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
          .then(() => res.send("customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});


app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query =
          "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});


app.post("/availability", function (req, res) {
  const avProdName = req.body.prod_id;
  const avProdSupp = req.body.supp_id;
  const avProdPrice = req.body.unit_price;

  if (!Number.isInteger(avProdName) || avProdName <= 0) {
    return res
      .status(400)
      .send("The number of the product should be a positive integer.");
  }

  pool
    .query("SELECT * FROM customers WHERE prod_id=$1", [avProdName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
        pool
          .query(query, [avProdName, avProdSupp, avProdPrice])
          .then(() => res.send("product is available!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

app.post("/orders", function (req, res) {
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  const orderCustomerId = req.body.customer_id;

  if (!Number.isInteger(orderCustomerId) || orderCustomerId  <= 0) {
    return res
      .status(400)
      .send("The customer id should be a positive integer.");
  }

  pool
    .query("SELECT * FROM orders WHERE order_date =$1", [orderReference])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An order with the same name already exists!");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [orderDate, orderReference, orderCustomerId])
          .then(() => res.send("order created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res
      .status(400)
      .send("The number of the order should be a positive integer.");
  }

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An order with the same name already exists!");
      } else {
        const query =
          "INSERT INTO orders (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
        pool
          .query(query, [customerId])
          .then(() => res.send("product is available!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});
// //UPDATE 

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query("UPDATE customers SET customer_name=$1 address=$2 city=$3 country=$4 WHERE id=$5", [newName, newAddress , newCity, newCountry, customerId])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Delete

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => pool.query("DELETE FROM customers WHERE id=$2", [orderId]))
    .then(() => res.send(`Customer ${orderId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM customers WHERE id=$1", [customerId])
    .then(() => res.send(`Customer ${customerId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

const listener = app.listen(port, () =>{
  console.log(`listening on port ${port}`)
})





