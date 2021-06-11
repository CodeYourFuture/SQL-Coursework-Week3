const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.listen(3001, () => console.log("Running on port 3001"));

const dbConfig = {
  host: "localhost",
  port: 5432,
  user: "Lisha",
  password: "ELISHA13",
  database: "cyf_ecommerce",
};

const pool = new Pool(dbConfig);

const customersQuery = `SELECT * FROM customers`;
const suppliersQuery = `SELECT * FROM suppliers`;
const productsQuery = `SELECT product_name, unit_price, supplier_name FROM products 
INNER JOIN product_availability ON products.id = product_availability.prod_id 
INNER JOIN suppliers ON suppliers.id = product_availability.supp_id`;

const insertCustomerQuery = `INSERT INTO customers 
(name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING id`;
​
const orderDeleteQuery = `DELETE FROM suppliers WHERE id = $1`;



function isValidID(id) {
  return !isNaN(id) && id >= 0;
}

function isValidCustomer(customerData) {
  // Only accept letters, numbers, white space and dash characters
  const regexp = /^[a-zA-Z0-9 -]{1,}$/g;
  return customerData.every((value) => {
    return (
      value &&
      value.match && // Make sure the match method exists
      value.match(regexp)
    );
    // Execute regular expression matching
  });
}

app.get("/customers", (req, res) =>
  pool.query(customersQuery, (error, result) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(result.rows);
    }
  })
);

app.get("/suppliers", (req, res) =>
  pool
    .query(suppliersQuery)
    .then((result) => res.send(result.rows))
    .catch((error) => res.status(500).send(error))
);

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(productsQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/customers/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!isValidID(id)) {
    res.status(404).send(customerIdFound);
  } else {
    pool
      .query(`SELECT * from customers WHERE ID = $1`, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          res.status(404).send(customerIdNotFound);
        } else {
          res.send(result.rows[0]);
        }
      })
      .catch((error) => res.status(500).send(error));
  }
});

app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;
  const customerData = Object.values({ name, address, city, country });
  const customerIsValid = isValidCustomer(customerData);

  if (!customerIsValid) {
    return res.status(400).send("cannot add customer");
  }
  pool
    .query(insertCustomerQuery, [...Object.values(req.body)])
    .then(() => res.status(201).send(`new customer added`))
    .catch((error) => res.status(500).send(error));
});

app.post("/products", (req, res) => {
  const newProduct = Object.values(req.body);
  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProduct[0]])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("This product already exists!");
      } else {
        const insertProductQuery = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(insertProductQuery, [newProductInfo[0]])
          .then(() => res.send("Product created!"))
          .catch((error) => res.send(error));
      }
    });
});

async function updatingProductData(data) { 
  const [newProdId, newSuppId, atUnitPrice]   = Object.Values(data);
  const prodIdQuery =`SELECT * FROM products WHERE id = $1`;
  const suppIdQuery =`SELECT * FROM suppliers WHERE id = $1`;


   if (!atUnitPrice || !newProdId || !newSuppId) {
    return res
      .status(400)
      .send("Provide missing product id or supplier id");
  }
  
if (!Number.isInteger(atUnitPrice) || atUnitPrice < 0) {
  return res 
  .status(400)
  .send("Invalid product unit price value");
}
try {
  let result = await pool.query(prodIdQuery.productNotFoundQuery, [newProdId]);

  if (result.rowCount === 0) {
    return res
    .status(400)
    .send[("The product does not exist")]
  }


    
  result = await pool.query(suppIdQuery.supplierNotFoundQuery, [newSuppId]);
  if (result.rowCount === 0) {
    return res
      .status(400) 
      .send[("The supplier does not exist.")]
  }

  
  app.post("/customers/:id", (req, res) => {
    const { id, order_date, order_reference } = req.body;
    const customerOrder = Object.values({ id, order_date, order_reference });
    const orderIsValid = isValidOrder(customerOrder);
  
    if (!orderIsValid) {
      return res.status(400).send(" unknown customer");
    }
    pool
      .query(insertCustomerQuery, [...Object.values(req.body)])
      .then(() => res.status(201).send(`customer Vaildated`))
      .catch((error) => res.status(500).send(error));

  })  
  

  app.put("/customers/:id", (req, res) => {
  let { name, address, city, country } = req.body;
  let customerData = Object.values({ name, address, city, country });
  let custId = isValidCustomer(customerData);
​
  if (!isValidID(id)) {
      res.status(404).send(customerNotFoundMessage);
    } else if (!isValidCustomer(custId)) {
      res.status(400).send(invalidCustomerMessage);
    } else {
      pool.query(customerUpdateQuery, [name, address, city, country ])
          .then(result => {
  if (result.rowCount === 0) {
      res.status(404).send(customerNotFoundMessage);
    } else {
      res.status(204).send();
    }
    }).catch(error => res.status(500).send(error));
}

  });


app.delete("/orders/:id", (req, res) => {
  const idOrder = parseInt(req.params.id);
​
  if (!isValidID(idOrder)) {
      res.status(404).send(orderNotFoundMessage);
  } else {
      pool.query(orderDeleteQuery, [id])
          .then(() => res.status(204).send())
          .catch(error => res.status(500).send(error));
  }
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

