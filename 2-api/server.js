const { response, query } = require("express");
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

 
app.get("/customers/:customerId/orders", (req, res) => {
  pool.connect().then((client) => {
    const customerId = req.params.customerId;
    return client
      .query(
        `
          SELECT
            o.order_reference, p.product_name,
            pa.unit_price, s.supplier_name, oi.quantity
          FROM order_items AS oi
          JOIN orders AS o ON o.id = oi.order_id
          JOIN products AS p ON p.id = oi.product_id
          JOIN product_availability AS pa ON pa.prod_id = oi.product_id
          JOIN suppliers AS s ON s.id = oi.supplier_id
          WHERE o.customer_id=$1
        `,
        [customerId]
      )
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      })
  });
});

 
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
        res.status(201).send(`Successfully added new customer.`);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

 
app.put("/customers/:customerId", (req, res) => {
  pool.connect().then((client) => {
    const c = req.body;
    const customerId = req.params.customerId;
    return client
      .query(
        `
        UPDATE customers
        SET name=$1, address=$2, city=$3, country=$4 
        WHERE id=$5
      `,
        [c.name, c.address, c.city, c.country, customerId]
      )
      .then(() => {
        res.send(`Successfully updated customer with the id of ${customerId}`);
      })
      .catch((error) => {
        console.error(error);
        res.status(400).send(error);
      });
  });
});

 
app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool.connect().then((client) => {
    return client
      .query(
        `
          SELECT * FROM orders WHERE customer_id=$1
        `,
        [customerId]
      )
      .then((result) => {
        if (result.rowCount > 0) {
          //has orders so can not delete
          throw "This customer has active orders."
        }
        pool
          .query(
            `
              DELETE FROM customers WHERE id=$1  
            `,
            [customerId]
          )
          .then(() => {
            res.send(`Successfully deleted customer with ID: ${cId}`);
          })
          .catch((error) => {
            console.error(error);
            res.status(400).send(error);
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(400).send(error);
      });
  });
});

 
app.post("/customers/:customerId/orders", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query(`SELECT COUNT(*) FROM customers WHERE id=$1`, [
        req.params.customerId,
      ])
      .then((result) => {
        if (parseInt(result.rows[0].count) !== 1) {
         
          
          res.status(400).send(
            `
              Something went wrong...
             
            `
          );
        } else {
          pool
            .query(
              `
                INSERT INTO orders (order_date, order_reference)
                VALUES($1, $2)
              `,
              [`${req.body.order_date}`, `${req.body.order_reference}`]
            )
            .then(() => {
              client.release();
              res.status(201).send("New order was successfully added.");
            })
            .catch((error) => {
              console.error(error);
              res.send(error);
            });
        }
      });
  });
});

 
app.delete("/orders/:orderId", (req, res) => {
  pool.connect().then((client) => {
    const orderId = req.params.orderId;
    return client
      .query(
        `
          DELETE FROM orders WHERE id=$1
        `,
        [orderId]
      )
      .then(() => {
        pool.query(
          `
            DELETE FROM order_items WHERE order_id = $1
          `,
          [orderId]
        );
      })
      .then(() => {
        res.send(`Successfully deleted order with ID: ${oId}`);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

 
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
        res.status(201).send(`Successfully added new product availability.`);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

 
app.get("/", (req, res) => {
  res.send(
    `
      welcome to the cyf_ecommerce_api
      ================================
      --Routes Included:
      ------------------
      --* (get)/customers - returns all customers
      ------* (get)/customers/:customerId - returns customer matching id
      ------* (post)/customers - adds a new customer
      ------* (put)/customers/:customerId - updates an existing customer
      ------* (post)/customers/:customerId/orders - adds new order for customer w/ matching id
      --* (get)/suppliers - returns all the suppliers
      --* (get)/products - return product names + costs + supplier
      --* (post)/availability = add new product availability 
        `
  );
});

//listen port
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
