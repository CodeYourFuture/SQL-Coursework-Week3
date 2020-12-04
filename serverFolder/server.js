
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
  
app.post("/customers",function (req,res){
  let {name}=req.body;
  let {address}=req.body;
  let {city}=req.body;
  let {country}=req.body;
  console.log("i am wokring customers")
  if(typeof (name)!="undefined" || typeof (address)!="undefined" || typeof (city)!="undefined" || typeof (country)!="undefined" )
  {
    const Query="INSERT INTO customers(name,address,city,country) VALUES($1,$2,$3,$4)";
      pool.query(Query,[name,address,city,country])
      .then(result=>res.send(result))
      .catch((e)=>console.log(e));
  }
  
  else{
    res.send("Cannot write data , some field are missing")
  }
});

// product name, a price and a supplier id







});




app.listen(3001,function(){
  console.log("Listening at port 3001");
});

