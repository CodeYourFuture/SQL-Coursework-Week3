
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


const { Pool, Client } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "cyf",
  port: "5432",
});


app.get("/customers",function(req,res){

  const Query="select * from customers";
  pool.query(Query)
  .then((result)=>res.send(result.rows))
  .catch((e)=>console.log(e));
});

app.get("/customers/:customerId",function(req,res){

  let {customerId}=req.params;
  console.log(customerId)
  if(typeof (customerId)!="undefined")
  {
    const Query="select * from customers where id=$1";
    pool.query(Query,[customerId])
    .then((result)=>res.send(result.rows))
    .catch((e)=>console.log(e));
  }
  else{
    res.send(false);
    console.log("I am here");
  }
});


app.get("/suppliers",function(req,res){

  const Query="select * from suppliers";
  pool.query(Query)
  .then((result)=>res.send(result.rows))
  .catch((e)=>console.log(e));
});

app.get("/products",function(req,res){
  
  let name=req.query.name;
  console.log(name);
  if(typeof (name)=="undefined")
  {
    console.log("Name is undefined")
     const Query="select product_name, supplier_name  from products inner join suppliers on suppliers.id=products.supplier_id"; 
     pool.query(Query)
     .then((result)=>res.send(result.rows))
     .catch((e)=>console.log(e));
  }
  else{
    const Query="select product_name, supplier_name  from products inner join suppliers on suppliers.id=products.supplier_id where product_name=$1";
    pool.query(Query,[name])
    .then((result)=>res.send(result.rows))
    .catch((e)=>console.log(e));
  }
  
});


app.post("/customers",function (req,res){
  let {name}=req.body;
  let {address}=req.body;
  let {city}=req.body;
  let {country}=req.body;
  if(typeof (name)!="undefined" || typeof (address)!="undefined" || typeof (city)!="undefined" || typeof (country)!="undefined" )
  {
    const Query="INSERT INTO customers(name,address,city,country) VALUES($1,$2,$3,$4)";
      pool.query(Query,[name,address,city,country])
      .then(result=>res.send("It has been added")) // confirm this to check if it has een added or not.
      .catch((e)=>console.log(e));
  }
  
  else{
    res.send("Cannot write data , some field are missing")
  }
});



app.post("/products", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newProductName = req.body.product_name;
  const newProductPrice = req.body.unit_price;
  const newProductSupplierId = req.body.supplier_id;
  if (!Number.isInteger(newProductPrice) || newProductPrice <= 0) {
    console.log(newProductPrice);
    return res
      .status(400)
      .send("The price of products should be a positive integer.");     
  }
  pool
    .query("SELECT * FROM suppliers WHERE id =$1", [newProductSupplierId])
    .then((result) => {
      if (!result.rows.length) {
        return res
          .status(400)
          .send(`Supplier with the ${newProductSupplierId} does not exists!`);
      }});
        const query =
          "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductName, newProductPrice, newProductSupplierId])
          .then(() => res.send("product has been created!"))
          .catch((e) => console.error(e));
});





app.post("/customers/:customerId/orders", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }

  let {order_date} =req.body;
  let {order_reference}=req.body; 
  let customer_id=req.params.customerId;

 if(typeof (order_date)=="undefined" || typeof (order_reference)=="undefined" || typeof (customer_id)=="undefined" )
  {
    res.send("One of the fields is missing");
  }

  pool
    .query("SELECT * FROM customers WHERE id =$1", [customer_id])
    .then((result) => {
      if (!result.rows.length) {
        return res
          .status(400)
          .send(`Customer with the ${customer_id} does not exists!`);
      }});
  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
  pool
    .query(query, [order_date, order_reference, customer_id])
    .then(() => res.send("Order has been created!"))
    .catch((e) => console.error(e));
});


app.listen(3001,function(){
  console.log("Listening at port 3001");
});



