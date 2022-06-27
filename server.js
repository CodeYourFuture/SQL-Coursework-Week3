const express = require('express')
const app = express();
const {Pool} = require('pg');

const port = process.env.PORT || 3000;
app.use(express.json());

const pool = new Pool({ 
   // give your username
   user: 'mahri',
   host: 'localhost', 
   // change the database name accordingly
   database: 'cyf_ecommerce',
   password: 'Hatyja-09',
   // Port number
   port: 5432
 })


//customer GET ALL

 app.get('/customers', (req, res)=>{
   pool.query('SELECT * FROM customers')
   .then ((result)=>res.json(result.rows))
   .catch((error)=>{
       console.log(error)
       res.status(500).json(error);
   })})

//customer GET ONE
app.get('/customers/:customerId', (req, res)=>{
    let cusID = req.params.customerId
    if(cusID){
      pool.query(`SELECT * FROM customers WHERE id=${cusID}`)
      .then ((result)=>res.json(result.rows))
      .catch((error)=>{
          console.log(error)
          res.status(500).json(error);
  })
  } else{
    console.log('Customer does not exist')
  }

}
)

//customer POST */---------- */
app.post("/customers", (req, res) => {
   const { name, address, city, country } = req.body;

   for (let key in req.body) {
     if (!req.body[key]) {
       return res.status(400).send("Please fill in all the details");
     }
   }
 
   pool
     .query(
       "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)",
       [name, address, city, country]
     )
     .then(() => res.send("Successful"))
     .catch((error) => console.log(error));
 });

//customer PUT ---------
app.put('/customers/:customerId', (req, res)=>{
   const id= parseInt(req.params.customerId)
   const {name,address, city, country }= req.body
   pool.query('UPDATE customers SET name =$1, address= $2, city=$3, country=$4 WHERE id = $5',[name,address,city,country,id])  
   .then (()=>{
         res.json( `Customer ${id} updated`)
         console.log( `Customer ${id} updated`)
   }
         )
   .catch((error)=>{
         console.log(error)
         res.status(500).json(error);
})
});

//customer DELETE
app.delete('/customers/:customerId', (req, res)=>{
  const customerId= parseInt(req.params.customerId)
  const orderId  = pool.query('SELECT customer_id FROM orders WHERE customers_id = $1',[customerId] );
  if(orderId!==customerId){
    pool.query('DELETE FROM customers WHERE id = $1', [customerId])  
    .then (()=>res.send( `Customer ${customerId} deleted`))
    .catch((error)=>{
        console.log(error)
        res.status(500).json(error);
    })
  } else{
    res.send( `Can not be Deleted; Customer ${customerId} has order`)
  }
  
})

//ORDERS Post
app.post("/customers/:customerId/orders", (req, res) => {
  const customer_id =  parseInt(req.params.customerId)
  const { order_date , order_reference } = req.body;

  for (let key in req.body) {
    if (!req.body[key]) {
      return res.status(400).send("Please fill in all the details");
    }
  }

  pool
    .query(
      "INSERT INTO orders (order_date , order_reference ,  customer_id) VALUES ($1, $2, $3)",
      [ order_date , order_reference , customer_id]
    )
    .then(() => res.send("Successful"))
    .catch((error) => console.log(error));
});
 
// suppliers GET
app.get('/suppliers', (req, res)=>{
   pool.query('SELECT * FROM suppliers')
   .then ((result)=>res.json(result.rows))
   .catch((error)=>{
       console.log(error)
       res.status(500).json(error);
   })
})


//products GET
app.get('/products', (req, res)=>{
   pool.query('SELECT * FROM products' )
   .then ((result)=>res.json(result.rows))
   .catch((error)=>{
       console.log(error)
       res.status(500).json(error);
   })
})

app.post("/products", (req, res) => {
   const { productName } = req.body;
   const query = "INSERT INTO products (product_name) VALUES ($1)";
   if (productName) {
     pool.query(query, [productName]);
     res.status(200).send("New product created! :)");
   } else {
     res.status(404).send("Couldn't create the new product");
   }
 });

 app.get('/availability', (req, res)=>{
   pool.query('SELECT * FROM product_availability' )
   .then ((result)=>res.json(result.rows))
   .catch((error)=>{
       console.log(error)
       res.status(500).json(error);
   })
})


app.post("/availability", function (req, res) {
    const{productId, supplierId, unitPrice}= req.body;
  
    if (Number(unitPrice) <= 0) {
      return res
        .status(400)
        .send("The unit-price should be a positive integer. Found " + unitPrice);
    }
   pool
    .query("SELECT * FROM products WHERE id = $1", [productId])
    .then((products) => {
      if (products.rows.length <= 0) {
        return res.status(400).send("Product not found");
      } else {
        pool
          .query("SELECT * FROM suppliers WHERE id = $1", [supplierId])
          .then((suppliers) => {
            if (suppliers.rows.length <= 0) {
              return res.status(400).send("Supplier not found");
            } else {
              pool
                .query(
                  "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
                  [productId, supplierId, unitPrice]
                )
                .then(() => res.send("Successful"))
                .catch((error) => console.log(error));
            }
          })
          .catch((error) => console.log(error));
      }
    })
    .catch((error) => console.log(error));
  });


app.listen(port, ()=> {
console.log('HEY we are listening in ' + port)
})

