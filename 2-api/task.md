# Homework

## Submission

You can continue working on the code from last week for this weeks task.

To submit you should open a pull request with all of your code in this folder.

## Task

In the following homework, you will create new API endpoints in the NodeJS application `cyf-ecommerce-api` that you created for last week's homework for the Database 2 class.

- If you don't have it already, add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.

- Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

//sql
app.get("/products", function (req, res) {
  const name = req.query.name;

  if (name) {
    pool
      .query(
        `SELECT  product_name, unit_price, supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE product_name= '${name}'`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  } else {
    pool
      .query(
        `SELECT  product_name, unit_price, supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});

- Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

//sql
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(`SELECT * FROM customers WHERE id = ${customerId}`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


- Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

//sql
app.post("/customers", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool
    .query(
      `INSERT INTO customers(name, address, city, country) VALUES($1,$2,$3,$4)`,
      [name, address, city, country]
    )
    .then(() => res.send("Info added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


- Add a new POST endpoint `/products` to create a new product.

//sql
app.post("/products", function (req, res) {
  const product_name = req.body.product_name;

  pool
    .query(`INSERT INTO products(product_name) VALUES($1)`, [product_name])
    .then(() => res.send("Product added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

- Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

- Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

//sql 
app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const name = req.body.product_name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool
    .query(
      ` UPDATE customers
       SET name = '${name}', address = '${address}', city = '${city}', country = '${country}'
       WHERE id = '${customerId}'`
    )
    .then((result) => res.json("Customer info updated!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

//sql 
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query(
      `DELETE FROM orders
      USING order_items WHERE orders.id = order_items.order_id AND order_id = '${orderId}' AND orders.id = '${orderId}'`
    )
    .then((result) => res.json("Deleted!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


- Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

//sql
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      ` DELETE FROM customers
        WHERE EXISTS (SELECT *
        FROM orders
        WHERE orders.customer_id = customers.id
        AND orders.customer_id ='${customerId}')`
    )
    .then((result) => res.json("Deleted!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

- Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

//sql
app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      `SELECT  order_reference, order_date, product_name, unit_price, supplier_name, quantity
FROM orders
JOIN order_items
ON orders.id = order_items.order_id
JOIN products
ON order_items.product_id = products.id
JOIN product_availability
ON order_items.product_id = product_availability.prod_id
JOIN suppliers
ON order_items.supplier_id = suppliers.id
WHERE orders.customer_id = '${customerId}'`
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});