const express = require("express");
const app = express();
const dotenv = require('dotenv');
const { Pool } = require('pg');
// const validator = require('validator');


dotenv.config();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
    connectionString: process.env.CONNECTIONSTRING,
});

//  get all customers

app.get("/customers", function (req, res) {
    const sql = 'SELECT * FROM customers';
    pool.query(sql, (error, result) => {
        if (error) throw error;
        res.json(result.rows);
    });
});

//  get all suppliers

app.get("/suppliers", function(req, res) {
    const sql ='SELECT * FROM suppliers';
    pool.query(sql, (error, result) => {
        if(error) throw error;
        res.json(result.rows);
    });
});

// If you don't have it already, add a new GET endpoint `/products` to load all the product names 
// along with their prices and supplier names.

app.get("/products", function(req, res) {
    const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
                 FROM products
                 INNER JOIN product_availability ON products.id = product_availability.prod_id
                 INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`
    pool.query(sql, (error, result) => {
        if(error) throw error;
        res.json(result.rows);
    });
});


// - Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, 
// for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

app.get("/products", function (req, res) {
    const name = req.query.name;
    if (name) {
        const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
                     FROM products
                     INNER JOIN product_availability ON products.id = product_availability.prod_id
                     INNER JOIN suppliers ON product_availability.supp_id = suppliers.id
                     WHERE product_name LIKE '%${name}%'`
        pool.query(sql, (error, result) => {
            if (error) throw error;
            res.json(result.rows);
        });
    } else {
        const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
                    FROM products
                    INNER JOIN product_availability ON products.id = product_availability.prod_id
                    INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`
        pool.query(sql, (error, result) => {
            if (error) throw error;
            res.json(result.rows);
        });
    }
});

// - Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get("/customers/:customerId", (req, res) => {
    const SelectCustomerId = req.params.customerId;
    const SQL = "SELECT * FROM customers WHERE id = $1";
    pool.query(SQL, [SelectCustomerId], (err, result) => {
        if (err) throw error;
        res.json(result.rows);
    })
})

// - Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", function (req, res) {
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;
    !newCustomerName || !newCustomerAddress
        || !newCustomerCity || !newCustomerCountry ? res.status(400).send("Please make sure you have added all fields.") :
        pool
            .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
            .then((result) => {
                if (result.rows.length > 0) {
                    return res
                        .status(400)
                        .send("A customer with the same name already exists!");
                } else {
                    const query =
                        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
                    pool
                        .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
                        .then(() => res.send("customer created!"))
                        .catch((e) => console.error(e));
                }
            });
});

// - Add a new POST endpoint `/products` to create a new product.

app.post("/products", (req, res) => {
    const newProductName = req.body.product_name;
    !newProductName ? res.status(400).send("The name must be unique") :
        pool
            .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
            .then((result) => {
                if (result.rows.length > 0) {
                    return res
                        .status(400)
                        .send("A product with the same name already exists!");
                } else {
                    const query =
                        "INSERT INTO products (product_name) VALUES ($1)";
                    pool
                        .query(query, [newProductName])
                        .then(() => res.send("Product created!"))
                        .catch((e) => console.error(e));
                }
            });
})

// - Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id).
//  Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post("/availability", (req, res) => {
    const newProd_id = req.body.prod_id;
    const newSupp_id = req.body.supp_id;
    const newUnit_price = req.body.unit_price;
    if (typeof newUnit_price !== "number" || newUnit_price < 0) {
        return res.status(400).send("The unit price must be number and positive")
    } else {
        pool.query("SELECT * FROM product_availability WHERE prod_id =$1", [newProd_id])
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("if")
                    return res.status(400).json({ msg: "The product does not exist!" })
                } else if (result.rows.length > 0) {
                    pool
                        .query("SELECT * FROM product_availability WHERE supp_id =$1", [newSupp_id])
                        .then((result) => {
                            if (result.rows.length === 0) {
                                return res
                                    .status(400).json({ msg: " The supplier ID does not exist!" })
                            } else {
                                const query = "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
                                pool
                                    .query(query, [newProd_id, newSupp_id, newUnit_price])
                                    .then(() => res.send("product_availability created!"))
                                    .catch((e) => console.error(e));
                            }
                        })
                        .catch((e) => console.error(e));
                }
            })
            .catch((e) => console.log(e))
    }


})

// - Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. 
// Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customerId/orders", (req,res) => {
    const customerId = req.params.customerId;
    const orderDate = req.body.order_date;
    const orderReference = req.body.order_reference;
    pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
        if (result.rows.length > 0) {
            const query =
                "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
            pool
                .query(query, [orderDate, orderReference, customerId])
                .then(() => res.send("customer created!"))
                .catch((e) => console.error(e));
        } else {
            return res
            .status(400)
            .send("A customer Id  is not exist.");
        }
    })
    .catch((error) => console.log(error))

})


// - Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put("/customers/:customerId", (req,res) => {
    const customerId = req.params.customerId;
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;
    console.log(newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry);
  if(newCustomerName && newCustomerAddress && newCustomerCity && newCustomerCountry){
      pool
        .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [newCustomerName, newCustomerAddress, newCustomerCity,newCustomerCountry, customer])
        .then(() => res.send(`Customer ${customerId} updated!`))
        .catch((e) => console.error(e));
  }else{
    return res.send({msg:"please make sure you added all fields."})
  }
})

// - Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

app.delete("/orders/:orderId", function (req, res) {
    const orderId = req.params.orderId;
    pool
      .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
      .then(() => {
        pool
          .query("DELETE FROM orders WHERE id=$1", [orderId])
          .then(() => res.send(`Your Order with  ${orderId} number  deleted!`))
          .catch((e) => console.error(e));
      })
      .catch((e) => console.error(e));
  });

// - Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

app.delete("/customers/:customerId", (req,resp) => {
    const customerId = req.params.customerId;
    console.log(customerId)
    pool
    .query("select * from orders where customer_id=$1",[customerId],(db_err,res) => {
        if(db_err){ return res.send(JSON.stringify(error))};
        if(res.rows.length == 0){
            pool.query("delete from customers where id=$1",[customerId], (db_err, db_res) => {
                if (db_err) {
                    return resp.status(500).send(JSON.stringify(db_err.message));
                } else {
                    return resp.json(db_res.rows);
                }
            })
        }else {
           return resp.status(400).send("you have an order I can not delete your profile.");
        }
    })
})

// - Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer.
//  Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.


app.get("/customers/:customerId/orders", (req, res) => {
    const SelectCustomerId = req.params.customerId;
    const SQL = `SELECT customers.id, orders.order_date, orders.order_reference, products.product_name, product_availability.unit_price,
    suppliers.supplier_name, order_items.quantity
    FROM order_items
    INNER JOIN suppliers on order_items.supplier_id = suppliers.id
    INNER JOIN product_availability on order_items.supplier_id = product_availability.supp_id
    INNER JOIN products on order_items.product_id = products.id
    INNER JOIN orders on order_items.order_id = orders.id
    INNER JOIN customers on orders.customer_id = customers.id
    WHERE customers.id=$1`
    pool.query(SQL, [SelectCustomerId], (err, result) => {
        if (err) throw error;
      return  res.json(result.rows);
    })
})
























app.listen(5000, function () {
    console.log("Server is listening on port 5000. Ready to accept requests!");
});