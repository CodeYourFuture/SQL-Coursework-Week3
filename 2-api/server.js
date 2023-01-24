const express = require("express");
const app = express();
app.use(express.json());
const port = process.env.PORT || 3001;


//** GET '/products'
app.get("/products", function(req, res) {
  pool.query('SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON pa.supp_id = s.id')
      .then((result) => res.json(result.rows))
      .catch((error) => {
          console.error(error);
          res.status(500).json(error);
      });
});

// GET `/customers/:customerId
app.get(`/customers/:customerId`, function(req,res){
    let customerId = req.params.customerId;
    pool.query('SELECT * FROM customers WHERE id=$1', [customerId])
    .then((result)=>res.json(result.rows))
    .catch((error) => {
        console.error(error);
        res.status(500).json(error);
    });
})

// POST `/customers` 
  app.post("/customers", (req, res) => {
    const newCustName = req.body.name;
    const newCustAddress = req.body.address;
    const newCustCity = req.body.city;
    const newCustCountry = req.body.country;
    
    const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4);";
    
    pool.query(query, [newCustName,newCustAddress,newCustCity,newCustCountry])
    .then((result)=> res.send("Customer added!"))
    .catch((error) => {
    res.status(500).send(error);
    });
    });

    //POST endpoint `/products`
    app.post('/products', (req, res)=> {
        const newProductName = req.body.product_name;
        const query = 'INSERT INTO products (product_name) VALUES ($1)';
        pool.query(query, [newProductName])
        .then(() => res.send("Product created!"))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })

    //POST `/availability`
    // app.post("/availability", function(req, res) {
    //     const prod_id = req.body.prod_id;
    //     const supp_id = req.body.supp_id;
    //     const newPrice = req.body.unit_price;
    
    //     const query = 'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)';
    //     pool.query(query, [prod_id, supp_id, newPrice])
    //         .then(() => res.send("Product created!"))
    //         .catch((error) => {
    //             console.error(error);
    //             res.status(500).json(error);
    //         });
    // });

  //POST `/customers/:customerId/orders`


   //PUT `/customers/:customerId`
   app.put("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
    const customerName = req.body.name;
    const customerAddress = req.body.address;
    const customerCity = req.body.city;
    const customerCountry = req.body.country;

    pool
      .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [customerName, customerAddress, customerCity, customerCountry, customerId])
      .then(() => res.send(`Customer ${customerId} updated!`))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });

  //DELETE `/orders/:orderId`
  app.delete("/orders/:orderId", function (req, res) {
    const orderId = req.params.orderId;
  
    pool
      .query("DELETE FROM order_items WHERE order_id =$1", [orderId])
      .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
      .then(() => res.send(`Order ${orderId} deleted!`))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });

  //DELETE `/customers/:customerId`

  // GET `/customers/:customerId/orders`
  app.get('/customers/:customerId/orders', (req, res) => {
    let customerId = req.params.customerId;
 const query ='SELECT customers.name, orders.order_date, orders.order_reference, products.product_name, product_availability.unit_price , suppliers.supplier_name, order_items.quantity FROM customers INNER JOIN orders ON customers.id = orders.customer_id INNER JOIN order_items ON order_items.order_id = orders.id INNER JOIN suppliers ON suppliers.id = order_items.supplier_id INNER JOIN products ON products.id = order_items.product_id INNER JOIN product_availability ON product_availability.prod_id = products.id WHERE customers.id=$1';
    pool.query(query, [customerId])
    .then((result)=>res.json(result.rows))
    .catch((error) => {
        console.error(error);
        res.status(500).json(error);
    }); 
  })

  app.listen(port, function() {
    console.log(`Server is listening on port ${port}. Ready to accept requests`);
});