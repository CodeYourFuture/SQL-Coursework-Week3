/// express
const { query } = require("express");
const express = require("express");
const app = express();
//  method express.json is used for Parse the json file which is sent by postman.
app.use(express.json());

/// pg package  baraye etesal be database  /// START
const { Pool, Connection } = require("pg");
const db = new Pool({
  host: "localhost",
  port: 5432,
  user: "rosha",
  password: "1111",
  database: "cyf_ecommerce",
});

//node-postgres.com/apis/client

// app.get("/customers", (request, response) => {
//   db.query("SELECT * FROM customers")
//     .then((res) => response.json(res.rows))
//     .catch((e) => console.error(e.stack));
// });

// or
app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});
// app.get("/products", function (req, res) {
//   db.query(
//     "select p.product_name,p_a.unit_price,s.supplier_name from products p inner join product_availability p_a on (p.id= p_a.prod_id) inner join suppliers s on( s.id= p_a.supp_id)",
//     (error, result) => {
//       res.json(result.rows);
//     }
//   );
// });

// week3

// - Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

app.get("/products", function (req, res) {
  const prodName = req.query.name;
  db.query(
    "SELECT * FROM products WHERE product_name like '%' || $1 || '%'",
    [prodName],
    (error, result) => {
      if (error == undefined) {
        res.json(result.rows);
      } else {
        console.log(error);
        res.status(400).json(error);
      }
    }
  );
});

// - Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get("/customers/:customerId", (req, res) => {
  const cusId = req.params.customerId;
  db.query("SELECT * FROM customers WHERE id= $1", [cusId], (error, result) => {
    if (error == undefined) {
      if (result.rows.length) {
        res.json(result.rows);
      } else {
        res.status(404).json({ message: "Customer not found" });
      }
    } else {
      console.log(error);
      res.status(400).json(error);
    }
  });
});

// - Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;
  const custQuery =
    "INSERT INTO customers(name, address, city, country) VALUES ($1,$2,$3,$4) RETURNING *";
  if (name && address && city && country) {
    db.query(custQuery, [name, address, city, country], (error, result) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`id: ${result.rows[0].id}`);
    });
  }
});

// - Add a new POST endpoint `/products` to create a new product.

app.post("/products", (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO products (product_name) VALUES ($1) ";
  db.query(query, [name], (error, result) => {
    if (error) {
      throw error;
    } else {
      res.status(201).send("user added a new prodcut");
    }
  });
});

// - Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post("/availability", async (req, res) => {
  const { unit_price, supplier_id, product_id } = req.body;
  const query =
    "INSERT INTO product_availability(unit_price, supp_id, prod_id)" +
    "values ($1 ,$2 , $3)" +
    "RETURNING *";

  const CheckSupplierId = await db
    .query("SELECT * FROM suppliers WHERE id=$1 ", [supplier_id])
    .then((result) => result.rows.length);

  const CheckProductId = await db
    .query("SELECT * FROM products WHERE id=$1", [product_id])
    .then((result) => result.rows.length); 

 
  if ( (CheckSupplierId, CheckProductId, unit_price > 0)) { 
    const result = await db.query(query, [unit_price, supplier_id, product_id]);
    res.status(201).json(result.rows);
  } else {
    res.status(400).send("error change input");
  }
});

// - Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customerId/orders", async (req, res) => {
  const { orderDate, orderReference } = req.body;
  const { customerId } = req.params;

  const CheckCustomerId = await db
    .query("SELECT * FROM customers WHERE id= $1", [customerId])
    .then((result) => result.rowCount);

  if (CheckCustomerId) {
    const q =
      "INSERT INTO orders(order_date, order_reference,customer_id)" +
      "values ($1 ,$2 , $3) RETURNING *";
    db.query( q, [orderDate, orderReference, customerId])
    .then( result => res.status(201).json(result.rows) )
    .catch( error => res.status(500).send("error on server =>" + error) )

  } else {
    res.status(400).send("not exsit");
  }
});

// Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put("/customers/:customerId" ,async (req,res)=>{
  const {name, address, city ,country}= req.body;
  const {customerId} = req.params;

  const CheckCustomerExist = await 
  db.query( "SELECT * FROM customers WHERE id= $1", [customerId])
  .then(result => result.rowCount )
 

  if (CheckCustomerExist) {
    const q = "UPDATE customers SET name=$1, address=$2, city=$3 ,country=$4 WHERE id = $5 RETURNING *";
    db.query(q, [name, address, city, country, customerId])
      .then((result) => res.status(200).json(result.rows))
      .catch((error) =>res.status(500).send("error on server =>" + error));
  }else{
    res.status(400).send("not exsit");
  }
});


// Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.
 app.delete("/orders/:orderId", (req, res) =>{ 
  const {orderId} = req.params;
   db.query("DELETE FROM order_items WHERE order_id =$1", [orderId])
   .then(result=> {
    db.query("DELETE FROM orders WHERE id=$1",[orderId])
    .then((result) => res.status(200).json(result.rows))
    .catch((error) => res.status(500).send("error on server =>" + error));
   })
   .catch((error) => res.status(500).send("error on server =>" + error))
 });





app.listen(3000);
