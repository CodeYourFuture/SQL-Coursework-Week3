# Homework

## Submission

You can continue working on the code from last week for this weeks task.

To submit you should open a pull request with all of your code in this folder.

## Task

In the following homework, you will create new API endpoints in the NodeJS application `cyf-ecommerce-api` that you created for last week's homework for the Database 2 class.

- If you don't have it already, add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.

- Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

app.get("/products", (req, res) => {
const productName = req.query.productName;

let query;
if (productName) {
query = `SELECT unit_price,supplier_name,product_name FROM products INNER JOIN product_availability as pa ON products.id= pa.prod_id INNER JOIN suppliers ON suppliers.id=pa.supp_id WHERE products.product_name LIKE '%${productName}%'`;
} else {
query = `SELECT unit_price,supplier_name,product_name FROM products INNER JOIN product_availability as pa ON products.id= pa.prod_id INNER JOIN suppliers ON suppliers.id=pa.supp_id`;
}
pool
.query(query)
.then((result) => {
res.send(result.rows);
})
.catch((err) => {
res.status(500).send(err);
});
});

- Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get("/customers/:customerId", (req, res) => {
const customerId = req.params.customerId;
const query = `SELECT * FROM customers WHERE id=${customerId}`;
pool
.query(query)
.then((result) => {
res.send(result.rows);
})
.catch((err) => {
res.status(500).send(err);
});
});

- Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
const newCustomerName = req.body.name;
const newCustomerAddress = req.body.address;
const newCustomerCity = req.body.city;
const newCustomerCountry = req.body.country;

const query =
"INSERT INTO customers (name,address,city,country) values ($1,$2,$3,$4)";

pool
.query(query, [
newCustomerName,
newCustomerAddress,
newCustomerCity,
newCustomerCountry,
])
.then(() => {
res.send("New customer added");
})
.catch((error) => {
res.status(500).send(error);
});
});

- Add a new POST endpoint `/products` to create a new product.

app.post("/products", (req, res) => {
const newProductName = req.body.name;

const query = "INSERT INTO products (product_name) values ($1)";

pool
.query(query, [newProductName])
.then(() => {
res.send("New product added");
})
.catch((error) => {
res.status(500).send(error);
});
});

- Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post("/availability", (req, res) => {
const prodId = req.body.prodId;
const suppId = req.body.suppId;
const unitPrice = req.body.unitPrice;

if (unitPrice < 0) {
res.status(404).send("please enter the correct price").end();
}

pool
.query(
`SELECT products.id,suppliers.id FROM products,suppliers where products.id=${prodId} AND suppliers.id=${suppId}`
)
.then((result) => {
if (result.rows.length == 0) {
res
.status(404)
.send("this product or suppliers is not available")
.end();
} else {
const query =
"INSERT INTO product_availability (prod_id,supp_id,unit_price) VALUES ($1,$2,$3)";
pool
.query(query, [prodId, suppId, unitPrice])
.then(() => {
res.send("data created");
})
.catch((error) => {
res.status(500).send(error);
});
}
});
});

- Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.get("/customers/:customerId/orders", (req, res) => {
const customerId = req.params.customerId;

let query =
"SELECT orders.id,order_date,order_reference,unit_price,quantity,product_name,supplier_name FROM ";
query +=
"orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON ";
query +=
"order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id ";
query +=
"INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1";
pool
.query(query, [customerId])
.then((result) => {
res.send(result.rows);
})
.catch((err) => {
res.status(500).send(err);
});
});

- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

app.delete("/orders/:orderId", (req, res) => {
const orderId = req.params.orderId;
pool
.query("DELETE FROM order_items WHERE order_id=$1", [orderId])
.then(() => {
pool.query("DELETE FROM orders WHERE id=$1", [orderId]).then(() => {
res.send(`The order with the order id of ${orderId} has been deleted`);
res.send("deleted");
});
})
.catch((error) => {
res.status(500).send(error);
});
});

- Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

app.delete("/customers/:customerId", (req, res) => {
const customerId = req.params.customerId;

pool
.query(`SELECT * FROM orders WHERE customer_id=${customerId}`)
.then((result) => {
if (result.rows.length > 0) {
res
.status(404)
.send("This customer has order/orders so it can not be deleted");
} else {
pool
.query(`DELETE FROM customers where id=${customerId}`)
.then(() => {
res.send(`Customer with the id of ${customerId} has been deleted`);
})
.catch((err) => {
res.status(500).send(err);
});
}
});
});

- Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

app.get("/customers/:customerId/orders", (req, res) => {
const customerId = req.params.customerId;

let query =
"SELECT orders.id,order_date,order_reference,unit_price,quantity,product_name,supplier_name FROM ";
query +=
"orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON ";
query +=
"order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id ";
query +=
"INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1";
pool
.query(query, [customerId])
.then((result) => {
res.send(result.rows);
})
.catch((err) => {
res.status(500).send(err);
});
});
