const { query } = require("express");
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// const pool = new Pool({
//   user: "saman",
//   host: "localhost",
//   database: "cyf_ecommerce",
//   password: "1234",
//   port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
}); 



// psql -h <HOST> -p <PORT> -U <USERNAME> -W <DB>


app.get("/", (req, res) => {
  const name = req.query.name;
  let where = "";
  if (name) where = `where product_name ilike '%${name}%'`;

  const queryString = `select product_name, supplier_name, unit_price 
    from products 
    inner join product_availability on prod_id= products.id
    inner join suppliers on suppliers.id = supp_id ${where}`;
  pool
    .query(queryString)
    .then((result) => res.json(result.rows))
    .catch((err) => res.json(err));
});



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

app.put("/customers/:customerId", (req, res) => {
    const {customerId} = req.params;
  const { name, address, city, country } = req.body;
  const queryString = `update customers set name = $1, address=$2, city=$3, country=$4 where id = $5`;

  pool
    .query(queryString, [name, address, city, country, customerId])
    .then(() => res.status(200).send("Customer updates!!!"))
    .catch((err) => res.json(err));
});

app.delete("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  const queryString = `delete from customers where id = $1`;

  pool
    .query(queryString, [customerId])
    .then(() => res.status(200).send("Customer deleted!!!"))
    .catch((err) => res.json(err));
});


const port = process.env.PORT || 9999;
app.listen(port, function () {
  console.log(`Server is listening on port ${port}. Ready to accept requests!`);
});

