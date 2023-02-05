const express = require("express");
const app = express();
require('dotenv').config()

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: process.env.PASS_WORD,
  port: 5432,
});
app.get("/", (req, res) => {
  res.send("hello");
});
//  getting all products
    app.get("/products", async function (req, res) {
        try {
          let query =
            "SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id)";
          let productName = req.query.name;
          let params = [];
          if (productName) {
            query = `SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id) WHERE p.product_name LIKE $1`;
            params.push(`%${productName}%`);
          }
          let result = await pool.query(query, params);
          res.json(result.rows);
        } catch (error) {
          console.error(error);
          res.status(500).json(error);
        }
      });

      // getting customers by id
      app.get("/customers/:id", (req, res) => {
        const customerId = req.params.id;
        const query = `SELECT * FROM customers WHERE id=${customerId}`;
      
        pool
          .query(query)
          .then((result) => {
            res.send(result.rows);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      });

      // creating a new customer profile
      app.post("/customers", (req, res) => {
        const newCustomerName = req.body.name;
        const newCustomerAddress = req.body.address;
        const newCustomerCity = req.body.city;
        const newCustomerCountry = req.body.country;
      
        const query =
          "INSERT INTO customers (name,address,city,country) values ($1,$2,$3,$4)";
      
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
      
          .then(() => {
            res.status(200).send("A new customer is added");
          })
          .catch((error) => {
            res.status(500).json(error);
          });
      });

      // getting all products

      app.get("/products/all", (req, res) => {
        pool
          .query("SELECT * FROM products")
          .then((result) => {
            res.json(result.rows);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      });

      // to create a new product
app.post("/products", (req, res) => {
  const newProduct = req.body.product_name;

  pool
    .query("INSERT INTO products ( product_name) values ($1)", [newProduct])
    .then(() => {
      res.send("A new product is added");
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//to create a new product availability
app.post("/availability", (req, res) => {
  const newUnitPrice = req.body.unit_price;
  const newSuppId = req.body.supp_id;
  const newProdId = req.body.prod_id;
  if (newUnitPrice < 0) {
    res.status(404).send("Unit price should be positive");
  }
  pool
    .query(
      "INSERT INTO product_availability (prod_id, supp_id, unit_price) values ($1, $2, $3)",
      [newProdId, newSuppId, newUnitPrice]
    )
    .then(() => {
      res.send("A new product_availability is added");
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});
//get all orders
app.get("/orders", (req, res) => {
  pool
    .query("SELECT * FROM orders")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

//To create new product
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
            [newOrderDate,newOrderReference, customerId])
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
   const{name, address, city, country}= req.body
const setQuery = "name= $1, address= $2, city= $3, country=$4";
   pool
     .query(`UPDATE customers  SET ${setQuery} WHERE id= $5`, [name, address, city, country,customerId])
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
         res
           .status(404)
           .send("This customer has order so, it can't be deleted");
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
     "SELECT orders.id,order_date,order_reference,unit_price,quantity,product_name,supplier_name FROM "
     "orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON "
     "order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id "
     "INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1"
   pool
     .query(query, [customerId])
     .then((result) => {
       res.send(result.rows);
     })
     .catch((error) => {
       res.status(500).json(error);
     });
 });


app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
