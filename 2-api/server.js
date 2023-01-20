const express = require("express");
const app = express();
app.use(express.json());
const port = process.env.PORT || 3001;

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

app.get(`/customers/:customerId`, function(req,res){
    let customerId = req.params.customerId;
    pool.query('SELECT * FROM customers WHERE id=$1', [customerId])
    .then((result)=>res.json(result.rows))
    .catch((error) => {
        console.error(error);
        res.status(500).json(error);
    });
})


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


    app.post("/availability", function(req, res) {
        const prod_id = req.body.prod_id;
        const supp_id = req.body.supp_id;
        const newPrice = req.body.unit_price;
    
        const query = 'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)';
        pool.query(query, [prod_id, supp_id, newPrice])
            .then(() => res.send("Product created!"))
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    });

    
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


  app.listen(port, function() {
    console.log(`Server is listening on port ${port}. Ready to accept requests`);
});