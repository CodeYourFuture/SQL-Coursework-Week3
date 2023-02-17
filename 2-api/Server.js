const express=require('express')
const app=express()
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
app.use(bodyParser.json());


const { Pool } = require('pg');

const db = new Pool({
    user: 'codeyourfuture',        // replace with you username
    host: 'localhost',
    database: 'cyf_ecommerce',
    password:process.env.db_password ,
    PORT: 5432
});
app.get('/',(req,res)=>{
    res.send('Hello')
})

app.get("/customers", async function(req, res) {
    const rs=await db.query('SELECT * FROM customers')
    res.json(rs.rows)
});
app.get("/suppliers", async function(req, res) {
    const rs=await db.query('SELECT * FROM suppliers')
    res.json(rs.rows)
});
app.get("/products", async function(req, res) {
    const rs=await db.query('SELECT product_name FROM products')
    res.json(rs.rows)
});

app.get("/customers/:id", function(req, res) {
    let custId = parseInt(req.params.id)
    db.query("SELECT * FROM customers WHERE  id = $1", [custId])
     .then ((result) =>res.json(result.rows))
        // TODO - more code here..)
      .catch(err=> res.status(500).json({error:err}));
  })
  app.post("/customers", function (req, res) {
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newCity=req.body.city;
    const newCountry = req.body.country;
  
    const query =
      "INSERT INTO customers (name, address, city, country) " +
        "VALUES ($1, $2, $3, $4)";
  
    db.query(query, [newName,newAddress,newCity,newCountry])
    .then( (result) => res.send("Customer created."))
    .catch(err=>res.status(500).json({error:err}))
  });
  app.post("/products",async function(req,res){
    const newProductname=req.body.product_name;
    const query=
    "INSERT INTO products (product_name) VALUES ($1)";
     const re=await db.query(query,[newProductname])
     res.send('Product created')
  })
app.get("/products",(req,res)=>{
    const productName=req.query.product_name
    const query=`SELECT product_name,unit_price, supplier_name              FROM products                 INNER JOIN product_availability ON product_availability.prod_id = products.id                      INNER JOIN suppliers ON product_availability.supp_id  = suppliers.id                      WHERE product_name ILIKE '%${                        productName || ""                }%' ; `
    db.query(query,(err,result)=>{
        res.send(result.rows)
    })
    
})






 app.put("/customers/:id",function(req,res){
    const custId=+req.params.id
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newCity=req.body.city;
    const newCountry = req.body.country;
    db.query("UPDATE customers SET name=$2,address=$3,city=$4,country=$5 WHERE id=$1",
    [custId,newName,newAddress,newCity,newCountry])
    .then(()=>res.send(`customer ${custId} is updated`))
    .catch(err=>{
        console.error(err);
        res.status(500).json({error:err})})
 })
app.delete("/orders/:id",function (req,res){
    const orderId=+req.params.id
    const query="DELETE FROM orders WHERE id=$1"
    db.query("DELETE FROM order_items WHERE order_id=$1",[orderId])
        .then(()=>{ db.query(query,[orderId])
        .then(()=>res.send(`order number ${orderId} is deleted` ))})
        .catch((err)=>console.log(err))
})

app.listen(PORT,(req,res)=>{
    console.log(`app is listening on port ${PORT}`);
})