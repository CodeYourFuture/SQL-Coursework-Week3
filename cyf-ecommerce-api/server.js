const express = require("express");
const app = express();
const { Pool } = require('pg');
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'Phoenix',
    port: 5432
});

app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});


app.get("/products", function(req, res) {
    const productName = req.query.product_name;
    console.log("Product Name:", productName);
    let query = 'SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name FROM products JOIN product_availability ON products.id = product_availability.prod_id JOIN suppliers ON product_availability.supp_id = suppliers.id';
    
    if (productName) {
        query += ' WHERE products.product_name=$1';
    }

    console.log("Query:", query);
    pool.query(query, [productName])
        .then((result) => {
            console.log("Result:", result.rows);
            res.json(result.rows)
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool.query('SELECT * FROM customers WHERE id=$1', [customerId])
      .then((result) => res.json(result.rows))
      .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName || !newCustomerAddress || !newCustomerCity || !newCustomerCountry) {
    return res.status(400).send({ error: "Bad Request: Missing required fields" });
  }

  const query = "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  pool.query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
    .then(() => res.send("Customer created successfully"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.post("/products", (req, res) => {
  const newProductName = req.body.name;
  const newProductPrice = req.body.price;
  const newProductSupplierId = req.body.supplierId;

  const query = "INSERT INTO products (name, price, supplierId) VALUES ($1, $2, $3)";
  pool.query(query, [newProductName, newProductPrice, newProductSupplierId])
    .then(() => res.send("Product created successfully"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});



app.post("/availability", (req, res) => {
  const newPrice = req.body.price;
  const productId = req.body.productId;
  const supplierId = req.body.supplierId;

  if (!newPrice || !productId || !supplierId) {
    return res.status(400).send("Bad Request: Missing required parameters");
  }

  if (!Number.isInteger(newPrice) || newPrice <= 0) {
    return res.status(400).send("Bad Request: Price must be a positive integer");
  }

  const productExistsQuery = "SELECT * FROM products WHERE id = $1";
  const supplierExistsQuery = "SELECT * FROM suppliers WHERE id = $1";

  Promise.all([
    pool.query(productExistsQuery, [productId]),
    pool.query(supplierExistsQuery, [supplierId]),
  ])
    .then((results) => {
      const productExists = results[0].rowCount > 0;
      const supplierExists = results[1].rowCount > 0;

      if (!productExists) {
        return res.status(400).send("Bad Request: Product with given ID doesn't exist");
      }
      if (!supplierExists) {
        return res.status(400).send("Bad Request: Supplier with given ID doesn't exist");
      }
      const query = "INSERT INTO availability (price, product_id, supplier_id) VALUES ($1, $2, $3)";
      pool.query(query, [newPrice, productId, supplierId])
        .then(() => res.send("Product availability created successfully"))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});



app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const orderDate = req.body.orderDate;
  const orderReference = req.body.orderReference;

  // Check if customer exists
  const customerQuery = "SELECT * FROM customers WHERE id = $1";
  pool.query(customerQuery, [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("Customer not found");
      }
      // Create order for existing customer
      const orderQuery = "INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)";
      pool.query(orderQuery, [customerId, orderDate, orderReference])
        .then(() => res.send("Order created successfully"))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});



app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const updatedCustomerName = req.body.name;
  const updatedCustomerAddress = req.body.address;
  const updatedCustomerCity = req.body.city;
  const updatedCustomerCountry = req.body.country;

  const query = "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE customer_id = $5";
  pool.query(query, [updatedCustomerName, updatedCustomerAddress, updatedCustomerCity, updatedCustomerCountry, customerId])
    .then(() => res.send("Customer updated successfully"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});



app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  const deleteOrderItemsQuery = "DELETE FROM order_items WHERE order_id = $1";
  const deleteOrderQuery = "DELETE FROM orders WHERE id = $1";

  pool.query(deleteOrderItemsQuery, [orderId])
    .then(() => pool.query(deleteOrderQuery, [orderId]))
    .then(() => res.send("Order deleted successfully"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});



app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  
  const checkOrdersQuery = "SELECT * FROM orders WHERE customer_id = $1";
  pool.query(checkOrdersQuery, [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        res.status(400).send("Cannot delete customer with existing orders");
      } else {
        const deleteCustomerQuery = "DELETE FROM customers WHERE id = $1";
        pool.query(deleteCustomerQuery, [customerId])
          .then(() => res.send("Customer deleted successfully"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const query = `
    SELECT 
      o.reference AS order_reference, 
      o.order_date AS order_date, 
      p.name AS product_name, 
      a.price AS unit_price, 
      s.name AS supplier_name, 
      oi.quantity AS quantity
    FROM 
      orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      JOIN products p ON oi.product_id = p.id 
      JOIN availability a ON p.id = a.product_id 
      JOIN suppliers s ON a.supplier_id = s.id 
    WHERE 
      o.customer_id = $1
  `;
  pool.query(query, [customerId])
    .then((results) => res.json(results.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
