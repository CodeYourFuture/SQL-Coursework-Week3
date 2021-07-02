# Homework

## Submission

You can continue working on the code from last week for this weeks task.

To submit you should open a pull request with all of your code in this folder.

## Task

In the following homework, you will create new API endpoints in the NodeJS application `cyf-ecommerce-api` that you created for last week's homework for the Database 2 class.

1. If you don't have it already, add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.

```
app.get("/products", function (_, response) {
  pool.query(
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products JOIN product_availability ON products.id = product_availability.prod_id JOIN suppliers ON product_availability.supp_id = suppliers.id;",
    (db_error, db_result) => {
      if (db_error) {
        response.send(JSON.stringify(db_error));
      } else {
        response.json(db_result.rows);
      }
    }
  );
});
```

2. Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

NOTE: I had help with this task

```
app.get("/products", function (request, response) {
  if (!request.query.name) {
    pool.query(
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products JOIN product_availability ON products.id = product_availability.prod_id JOIN suppliers ON product_availability.supp_id = suppliers.id;",
      (db_error, db_result) => {
        if (db_error) {
          response.send(JSON.stringify(db_error));
        } else {
          response.json(db_result.rows);
        }
      }
    );
  } else {
    const name = request.query.name;
    pool.query(
      `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products JOIN product_availability ON products.id = product_availability.prod_id JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE product_name = '${name}'`,
      (db_error, db_result) => {
        if (db_error) {
          response.send(JSON.stringify(db_error));
        } else {
          response.json(db_result.rows);
        }
      }
    );
  }
});
```

3. Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

```
app.get("/customers/:customerId", function (request, response) {
  const customer_id = parseInt(request.params.customerId);
  pool.query(
    `SELECT * FROM customers WHERE customers.id = ${customer_id}`,
    (db_error, db_result) => {
      if (db_error) {
        response.send(JSON.stringify(db_error));
      } else {
        response.json(db_result.rows);
      }
    }
  );
});
```

4. Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

```
app.post("/customers", function (request, response) {
  const newCustomerName = request.body.name;
  const newCustomerAddress = request.body.address;
  const newCustomerCity = request.body.city;
  const newCustomerCountry = request.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => response.send("Customer created!"))
    .catch((e) => console.error(e));
});
```

5. Add a new POST endpoint `/products` to create a new product.

```
app.post("/products", function (request, response) {
  const newProductName = request.body.product_name;

  const query =
    "INSERT INTO products (product_name) VALUES ($1)";

  pool
    .query(query, [newProductName])
    .then(() => response.send("Product created!"))
    .catch((e) => console.error(e));
});
```

6. Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

NOTE: I had help with this task

```
app.post("/availability", function (request, response) {
  const newProductID = request.body.prod_id;
  const newProductPrice = request.body.unit_price;
  const newProductSupplierID = request.body.supp_id;

  if (!Number.isInteger(newProductPrice) || newProductPrice <= 0) {
    return response
      .status(400)
      .send("The unit price should be a positive integer.");
  }

  let querySupplierID = `SELECT * FROM product_availability WHERE supp_id = ${newProductSupplierID}`;
  pool.query(querySupplierID, (_, db_result) => {
    if (db_result.rows.length === 0) {
      response.send("Supplier ID does not exist");
      return;
    }
  });

  let queryProductID = `SELECT * FROM product_availability WHERE prod_id = ${newProductID}`;
  pool.query(queryProductID, (_, db_result) => {
    if (db_result.rows.length === 0) {
      response.send("Product ID does not exist");
      return;
    }
  });

  let queryBothID = `SELECT * FROM product_availability WHERE prod_id = ${newProductID} AND supp_id = ${newProductSupplierID}`;
  pool.query(queryBothID, (_, db_result) => {
    if (db_result.rows.length > 0) {
      response.send("Product and Supplier ID combination already exists");
      return;
    }
  });

  const query =
    "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES ($1, $2, $3)";

  pool
    .query(query, [newProductPrice, newProductSupplierID, newProductID])
    .then(() => response.send("Product availability added!"))
    .catch((e) => console.error(e));
});
```

7. Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

```
app.post("/customers/:customerId/orders", function (request, response) {
  const newOrderDate = request.body.order_date;
  const newOrderReference = request.body.order_reference;
  const customerID = request.params.customerId;

  let queryCustomerID = `SELECT * FROM customers WHERE id = ${customerID}`;
  pool.query(queryCustomerID, (_, db_result) => {
    if (db_result.rows.length === 0) {
      response.status(404).send("Customer ID does not exist");
      return;
    }
  });

  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

  pool
    .query(query, [newOrderDate, newOrderReference, customerID])
    .then(() => response.send("New order added!"))
    .catch((e) => console.error(e));
});
```

8. Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

NOTE: I had help with this task

```
app.put("/customers/:customerId", function (request, response) {
  const customerID = request.params.customerId;
  const newCustomerName = request.body.name;
  const newCustomerAddress = request.body.address;
  const newCustomerCity = request.body.city;
  const newCustomerCountry = request.body.country;

  const query = `UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5`;

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
      customerID,
    ])
    .then(() => response.send("Customer details updated!"))
    .catch((e) => console.error(e));
});
```

9. Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

```
app.delete("/orders/:orderId", function (request, response) {
  const orderId = request.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => response.send(`Orders and ordered items from ID ${orderId}, deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});
```

10. Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

```
app.delete("/customers/:customerId", function (request, response) {
  const customerId = request.params.customerId;

  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
    .then((_, db_result) => {
      if (db_result.rows.length === 0) {
        pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => response.send(`Customer ID ${customerId}, deleted!`))
        .catch((e) => console.error(e));
      } else {
        response
        .status(403)
        .send("The selected customer has orders in its account.")
      }

    })
    .catch((e) => console.error(e));
});
```

11. Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

```
app.get("/customers/:customerId/orders", function (request, response) {
  const customer_id = parseInt(request.params.customerId);
  const query = `SELECT orders.customer_id, orders.order_reference, orders.order_date, products.product_name, suppliers.supplier_name, order_items.quantity, product_availability.unit_price FROM orders JOIN order_items ON orders.id = order_items.order_id JOIN suppliers ON order_items.supplier_id = suppliers.id JOIN product_availability ON order_items.supplier_id = product_availability.supp_id JOIN products ON product_availability.prod_id = products.id WHERE orders.customer_id=$1`;

  pool.query(query, [customer_id], (db_error, db_result) => {
    if (db_error) {
      response.send(JSON.stringify(db_error));
    } else {
      response.json(db_result.rows);
    }
  });
});
```
