const express = require("express");
const { Pool } = require("pg");
const app = express();
const PORT =  5000;
app.use(express.json());


const pool = new Pool({
    user:'postgres',
    host:'localhost',
    database: "cyf_ecommerce",
    password:'postgres',
    port:5432
    
});


  app.get('/customers', (req,res)=>{
     const fetchCustomers = `SELECT * FROM customers`; 
     pool.query(fetchCustomers, (error, result) => { 
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(result.rows);    
        }     
      });

});

app.get("/customers/:customerId", (req,res)=>{
    const customerId = req.params.customerId;
    const  sql = "SELECT * FROM customers WHERE id=$1";
    pool
    .query(sql, [customerId])
    .then((result) => res.json(result.rows))
    .catch((e)=> console.error(e));
});




//********************************All THE POST REQUESTS******************************************** */

app.post('/customers', async (req, res) => {
    const { name, address, city, country } = req.body;
    const sqlInsert = 'INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)';
    try {
      await pool.query(sqlInsert, [name, address, city, country]);
      res.json({ Successfull : `Customer  ${name} is successfully registered!` });
    } catch (error) {
      res.status(500).send(error);
    }
  });
  

 app.post('/products', async (req,res)=> {
     const {product_name} = req.body;
     const sql = 'INSERT INTO products (product_name) VALUES ($1)';
                 
     try{
        await pool.query(sql, [product_name]);
        res.json({Successfull:`Product ${product_name} is successfully Added`});
        }catch(error){
        res.status(500).send(error);
     }
 }); 

//  const isValid = (n) => {
//   return Number.isInteger(n) && n >= 0;

// }



const isValid = (num) => {
  return !Number.isNaN(num) && num > 0;
}

//Add a new POST endpoint `/availability`

app.post('/availability', async (req, res) => {
  let{ supp_id, prod_id ,unit_price  } = req.body;
  const InsertQuery = 'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);';
  const selectQuery = 'select exists(select 1 from product_availability where supp_id=$1 AND prod_id=$2);';
  const supplierExistsQuery = 'select exists(select 1 from suppliers where id=$1);';
  const productsExistsQuery = 'select exists(select 1 from products where id=$1);';


  if (!isValid(supp_id) || !isValid(prod_id) || !isValid(unit_price)) {
    res.send("Please Enter the Number"+ prod_id);
  } else if (isValid(supp_id) && isValid(prod_id) && isValid(unit_price)) {
    try {
      const result = await pool.query(selectQuery, [supp_id, prod_id]);
      const isAvaliable = result.rows.map(el =>   el.exists);
     
      const suppliersResult = await pool.query(supplierExistsQuery, [supp_id]);
      const supplierExists = suppliersResult.rows.map(el => el.exists);

      const productsResult = await pool.query(productsExistsQuery, [prod_id]);
      const productExists = productsResult.rows.map(el => el.exists);

      if (isAvaliable[0]) {
        res.status(400).send('Product is already Availabile!');
      } else if (!supplierExists[0]) {
        res.status(400).send('Supplier does not exist');
      } else if (!productExists[0]) {
        res.status(400).send('Product does not exist!');
      } else {
        pool.query(InsertQuery, [prod_id, supp_id, unit_price])
          .then(() => res.send("New Record was inserted"))
          .catch(error => console.error(error))
      }

    } catch (error) {
      res.status(500).send(error);
    }
  }

});


//create a new order
app.post("/customers/:customerId/orders", (req,res)=>{
  const customerId=req.params.customerId;
  const {order_date, order_reference}=req.body;
  const selectQuery=`select * from customers where id=$1 `;
  const insertQuery = `insert into orders (order_date, order_reference, customer_id) values ($1,$2,$3)`;
  pool
  .query(selectQuery,[customerId])
  .then((result)=>{
    if(result.rows.length==0){
     return res.status(400).send("The customer does not exists in the database!");
    }
    else{
      pool
      .query(insertQuery,[order_date, order_reference, customerId])
      .then(()=> res.send("New Order was Inserted "))
      .catch((e)=>console.log(e));
    }
  })
});


//************************************UPDATE REQUEST**************************************************//

//updating single customer
app.put("/customers/:customerId", (req, res) =>{
  const customerId = req.params.customerId;
  const {name,address,city,country} = req.body;
  pool
    .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [name, address, city, country, customerId])
    .then(() => res.send(`Customer with ${customerId} is updated!`))
    .catch((e) => console.error(e));
});


//**************************************DELETE REQUEST************************************** */
app.delete("/orders/:orderId", (req,res)=>{
  const orderId = req.params.orderId;
  const deleteQuery= "DELETE FROM  order_items where order_id=$1";
  const deleteOrder = "DELETE FROM orders where id=$1";
  pool.query(deleteQuery, [orderId])
  .then(() =>{
    pool
    .query(deleteOrder, [orderId])
    .then(() => res.send("order Deleted"))
    .catch((e) =>console.error(e));
  })

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


//************************************GET REQUEST********************************************* *//

const fetchSuppliers = `SELECT * FROM suppliers`;
  app.get('/suppliers', (req,res)=>{
     pool.query(fetchSuppliers, (error, result) => { 
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(result.rows);    
        }     
      });

});


app.get("/customers/:customerId/orders",  async (req, res) => {
  const customerId = req.params.customerId;
  const selectSQL = `SELECT customers.id, orders.order_date, orders.order_reference, products.product_name, product_availability.unit_price,
  suppliers.supplier_name, order_items.quantity
  FROM order_items
  INNER JOIN suppliers on order_items.supplier_id = suppliers.id
  INNER JOIN product_availability on order_items.supplier_id = product_availability.supp_id
  INNER JOIN products on order_items.product_id = products.id
  INNER JOIN orders on order_items.order_id = orders.id
  INNER JOIN customers on orders.customer_id = customers.id
  WHERE customers.id=$1`

  if (!isValid(customerId)){
   res.send("invalid id");
  }else{
      await pool.query(selectSQL, [customerId], (err, result) => {
      if (err) throw error;
    return  res.send(result.rows);
  })
  }

})



//filter the list of products by name using a query parameter
app.get('/products', (req,res)=>{
const sqlstring = `SELECT  products.product_name,product_availability.unit_price,suppliers.supplier_name
  FROM products
  INNER JOIN  product_availability ON  product_availability.prod_id = products.id
  INNER JOIN suppliers ON suppliers.id = product_availability.supp_id  `;

   const sqlQuery = req.query.name

    ? sqlstring.concat(` where product_name='${req.query.name}'`)
    : sqlstring;
     pool
     .query(sqlQuery, (error, result) => { 
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(result.rows);    
        }     
      });

});





app.listen(PORT, () =>{
   console.log(`server Running on port ${PORT} `);
})