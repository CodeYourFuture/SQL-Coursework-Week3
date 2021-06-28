const express = require("express");
const app = express();
app.use(express.json());

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

const { Pool } = require("pg");
const pool = new Pool({
  user: "morteza",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("select * from customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", (req, res) => {
  const sqlQuery = `select * from customers where id=${req.params.customerId}`;
  pool.query(sqlQuery, (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId/orders", (req, res) => {
  console.log(req.params.customerId);
  const sqlQuery = `select order_reference,order_date,quantity, product_name,supplier_name,unit_price,quantity from customers
     inner join orders on customers.id=orders.customer_id
     inner join order_items on orders.id=order_items.order_id 
     inner join products on products.id=order_items.product_id 
     inner join product_availability  on product_availability.prod_id = order_items.product_id  
     inner join suppliers on suppliers.id=order_items.supplier_id where customers.id=${req.params.customerId}`;
  console.log(sqlQuery);
  pool.query(sqlQuery, (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  pool.query("select * from suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", function (req, res) {
  let queryStr = `select product_name,unit_price,supplier_name from products
   inner join product_availability on products.id=product_availability.prod_id
   inner join suppliers on suppliers.id=product_availability.supp_id `;
  sqlQuery = req.query.name
    ? queryStr.concat(` where product_name='${req.query.name}'`)
    : queryStr;
  pool.query(sqlQuery, (error, result) => {
    res.json(result.rows);
  });
});

app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;

  pool.query("SELECT * FROM customers WHERE name=$1", [name]).then((result) => {
    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("A customer with the same name already exists!");
    } else {
      const query =
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
      pool
        .query(query, [name, address, city, country])
        .then(() => res.send("customer created!"))
        .catch((e) => console.error(e));
    }
  });
});

app.post("/products", (req, res) => {
  const { product_name } = req.body;

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [product_name])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [product_name])
          .then(() => res.send("product created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/availability", (req, res) => {
  const { supplierId, unitPrice, productId } = req.body;
  if (!supplierId || !productId || !unitPrice || unitPrice < 0) {
    return res.status(400).send("Data is not correct");
  }
  pool
    .query("SELECT * FROM products WHERE id=$1", [productId])
    .then((result) => {
      if (result.rows.length != 0) {
        pool
          .query("SELECT * FROM suppliers WHERE id=$1", [supplierId])
          .then((result) => {
            if (result.rows.length != 0) {
                pool
                  .query(
                    "select * from product_availability where prod_id =$1 and supp_id =$2;",
                    [productId, supplierId]
                  )
                  .then((result) =>{ 
                    if(result.rows.length>0){
                        return res
                          .status(400)
                          .send("This product availability is exists!");
                    }  
                   else{
                        const query =
                "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);";
              pool
                .query(query, [productId, supplierId, unitPrice])
                .then(() => res.send("product created!"))
                .catch((e) => console.error(e));
                   }
                  })
             
            } else {
              return res.status(400).send("The supplier is not exists!");
            }
          })
      } 
      else {
        return res.status(400).send("The supplier is not exists!");
      }
    });
});

app.post("/customers/:customerId/orders",(req,res)=>{
  const customerId=req.params.customerId;
  const {order_date, order_reference}=req.body;
  const selectQuery=`select * from customers where id=$1 `;
  const insertQuery = `insert into orders (order_date, order_reference, customer_id) values ($1,$2,$3)`;
  pool
  .query(selectQuery,[customerId])
  .then((result)=>{
    if(result.rows.length==0){
     return res.status(400).send("The customer is not exists!");
    }
    else{
      pool
      .query(insertQuery,[order_date, order_reference, customerId])
      .then(()=> res.send("Order created"))
      .catch((e)=>console.log(e));
    }
  })
});

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const {name, address, city, country} = req.body;

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
      [name, address, city, country, customerId]
    )
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
});




app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const query1 = "delete from order_items where order_id=$1";
  const query2 = "delete from orders where id=$1";
  console.log(query1, query2);
  pool
    .query(query1, [orderId])
    .then(() => {
      pool
        .query(query2, [orderId])
        .then(() => res.send(`The order is deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const query1 = "select * from orders where customer_id=$1";
  const query2 = "delete from customers where id=$1";
  console.log(query1, query2);
  pool
    .query(query1, [customerId])
    .then((result) => {
      if(result.rows.length==0){
      pool
        .query(query2, [customerId])
        .then(() => res.send(`The order is deleted!`))
        .catch((e) => console.error(e));
      }
      else{
        res.send(`The customer has ordered items`);
      }

    })
    .catch((e) => console.error(e));
});