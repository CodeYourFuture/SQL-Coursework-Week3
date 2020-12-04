
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

app.get("/suppliers",function(req,res){

  const Query="select * from suppliers";
  pool.query(Query)
  .then((result)=>res.send(result.rows))
  .catch((e)=>console.log(e));
});



app.get("/products",function(req,res){

  const Query="select product_name, supplier_name  from products inner join suppliers on suppliers.id=products.supplier_id";
  pool.query(Query)
  .then((result)=>res.send(result.rows))
  .catch((e)=>console.log(e));
});

app.listen(3000,function(){
  console.log("Listening at port 3000");
});