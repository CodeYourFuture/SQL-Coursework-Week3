const { query } = require("express");
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  user: "saman",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "1234",
  port: 5432,
});

app.get("/products", (req,res)=>{
    const name = req.query.name;
    let where = "";
    if(name) where = `where product_name ilike '%${name}%'`;
    
    const queryString=`select product_name, supplier_name, unit_price 
    from products 
    inner join product_availability on prod_id= products.id
    inner join suppliers on suppliers.id = supp_id ${where}`
    pool
    .query( queryString)
    .then((result)=> res.json(result.rows))
    .catch((err)=> res.json(err))
})


app.get("/customers/:customerId", (req,res)=>{
    const { customerId } = req.params;
    const queryString = `select * from customers where id = $1`
    
    pool
    .query( queryString, [customerId])
    .then((result)=> {
        console.table(result.rows)
        res.json(result.rows)
    })
    .catch((err)=> res.json(err))
})

app.post("/customers", (req,res)=>{
    const { name, address, city, country} = req.body;
    const queryString = `insert into customers ( name, address, city, country) values ($1, $2, $3, $4)`

    pool.query(queryString, [name, address, city, country])
    .then(()=>res.status(200).send("New customer!!!"))
    .catch((err)=> res.json(err));
})

app.listen(4005, function () {
  console.log("Server is listenening on port 4005, Ready to accept requests!");
});