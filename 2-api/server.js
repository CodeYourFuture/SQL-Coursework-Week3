/*
to-do:
- add status codes to errors.
*/

const { response } = require("express");
const express = require("express");
const postgres = require("pg");
app = express();
app.use(express.json());
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const pool = new postgres.Pool({
  connectionString: process.env.PG_CONNECT,
});

// fetches customer matching the provided id
app.get("/customers/:customerId", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query(
        `SELECT * 
      FROM customers AS c
      WHERE c.id = $1`,
        [`${req.params.customerId}`]
      )
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

//fetches all customers
app.get("/customers", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query("SELECT * FROM customers")
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

//adds a new customer
app.post("/customers", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query(
        `
      INSERT INTO customers(name, address, city, country)
      VALUES($1, $2, $3, $4)
      `,
        [
          `${req.body.name}`,
          `${req.body.address}`,
          `${req.body.city}`,
          `${req.body.country}`,
        ]
      )
      .then(() => {
        client.release();
        res.send(`Successfully added new customer.`);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

/* 
Add a new POST endpoint `/customers/:customerId/orders` 
to create a new order (including an order date, and an order
reference) for a customer. Check that the customerId corresponds
to an existing customer or return an error.
*/
app.post("/customers/:customerID/orders", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query(`SELECT COUNT(*) FROM customers WHERE id=$1`,[req.params.customerId])
      .then((result) => {
        if(parseInt(result) !== 1){
          /* either somehow there are multiple customers with the 
          same ID or that customer doesn't exist */
          throw "Something went wrong :/"
        }
      })
      .query(
        `
          INSERT INTO orders (order_date, order_reference)
          VALUES($1, $2)
        `,
        [
          `${req.body.order_date}`,
          `${req.body.order_reference}`,
        ]
      )
      .then(() => {
        client.release();
        res.send("Successfully added new order.");
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

// fetches the suppliers table
app.get("/suppliers", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query("SELECT * FROM suppliers")
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

//fetches all products or products matching the name in the query
app.get("/products", (req, res) => {
  pool.connect().then((client) => {
    if (req.query.name) {
      return client
        .query(
          `
                SELECT p.product_name, pa.unit_price, s.supplier_name
                FROM product_availability AS pa
                JOIN products AS p
                on p.id = pa.prod_id
                JOIN suppliers AS s
                ON pa.supp_id = s.id
                WHERE LOWER(p.product_name) LIKE($1)
            `,
          [`%${req.query.name.toLowerCase()}%`]
        )
        .then((result) => {
          client.release();
          res.send(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.send(error);
        });
    } else {
      return client
        .query(
          `
                SELECT p.product_name, pa.unit_price, s.supplier_name
                FROM product_availability AS pa
                JOIN products AS p
                on p.id = pa.prod_id
                JOIN suppliers AS s
                ON pa.supp_id = s.id
            `
        )
        .then((result) => {
          client.release();
          res.send(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.send(error);
        });
    }
  });
});

//adds new product availability
app.post("/availability", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query(
        `
      INSERT INTO product_availability(prod_id, unit_price, supp_id)
      VALUES($1, $2, $3)
      `,
        [`${req.body.prod_id}`, `${req.body.unit_price}`, `${req.body.supp_id}`]
      )
      .then(() => {
        client.release();
        res.send(`Successfully added new product availability.`);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

app.get("/", (req, res) => {
  res.send(
    `welcome to the cyf_ecommerce_api

        Routes Included:
        ----------------
        * /customers - returns all customers
        * /suppliers - returns all the suppliers
        * /products - return product names + costs + supplier`
  );
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
