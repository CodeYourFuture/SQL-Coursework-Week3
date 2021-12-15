const express = require("express");
const app = express();
app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "andy",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "*****",
  port: 5432,
});

// Return all the customers from the database
app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => {
      result.rows.length <= 0
        ? res.status(400).json({
            result: "failure",
            message: "BAD REQUEST: Unable to retrieve customers",
          })
        : res.status(200).json(result.rows);
    })
    .catch((e) => res.status(400).send(e));
});

// Return all the suppliers from the database
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => {
      result.rows.length <= 0
        ? res.status(400).json({
            result: "failure",
            message: "BAD REQUEST: Unable to retrieve suppliers",
          })
        : res.status(200).json(result.rows);
    })
    .catch((e) => res.status(400).send(e));
});

// 2. Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customer/:id", (req, res) => {
  const customerId = Number(req.params.id);

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: invalid input type",
    });
  }

  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      result.rows.length <= 0
        ? res.status(404).json({
            result: "failure",
            message: `NOT FOUND: No Video with id:${customerId} in list`,
          })
        : res.status(200).json(result.rows);
    })
    .catch((e) => res.status(400).send(e));
});

// 1. Add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.
//    Update GET endpoint `/products` to filter the list of products by name using a query parameter,
//    for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!
app.get("/products", (req, res) => {
  const productName = req.query.name;

  const productsQuery =
    productName === undefined
      ? `
        SELECT
          p.product_name,
          pa.unit_price AS price,
          s.supplier_name
        FROM
          products AS p
          INNER JOIN product_availability AS pa ON p.id = pa.prod_id
          INNER JOIN suppliers AS s ON pa.supp_id = s.id;`
      : `
        SELECT
          p.product_name,
          pa.unit_price AS price,
          s.supplier_name
        FROM
          products AS p
          INNER JOIN product_availability AS pa ON p.id = pa.prod_id
          INNER JOIN suppliers AS s ON pa.supp_id = s.id;
        WHERE
          UPPER(p.product_name) LIKE UPPER('%${productName}%');`;

  pool
    .query(productsQuery)
    .then((result) => {
      result.rows.length <= 0
        ? res.status(400).json({
            result: "failure",
            message: "BAD REQUEST: Unable to retrieve products",
          })
        : res.status(200).json(result.rows);
    })
    .catch((e) => res.status(400).send(e));
});

// 3.  Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.
app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;

  if (
    name === undefined ||
    address === undefined ||
    city === undefined ||
    country === undefined
  ) {
    return res.status(400).json({
      result: "failure",
      message: `BAD REQUEST: New customer could not be saved, address, city or url not specified`,
    });
  }

  const insertNewCustomer = `
    INSERT INTO
      customers (name, address, city, country)
    VALUES
      ($1, $2, $3, $4) RETURNING id`;

  pool
    .query(insertNewCustomer, [name, address, city, country])
    .then((result) => {
      id = result.rows[0].id;

      res.status(201).json({
        result: "success",
        message: `CREATED: customer was added with id:${id}`,
      });
    })
    .catch((e) => res.status(400).send(e));
});

// 4. Add a new POST endpoint `/products` to create a new product.
app.post("/products", (req, res) => {
  const { productName } = req.body;

  if (productName === undefined) {
    return res.status(400).json({
      result: "failure",
      message: `BAD REQUEST: Product could not be saved, product not specified`,
    });
  }

  const insertNewProduct = `
    INSERT INTO
      products (product_name)
    VALUES
      ($1) RETURNING id`;

  pool
    .query(insertNewProduct, [productName])
    .then((result) => {
      id = result.rows[0].id;

      res.status(201).json({
        result: "success",
        message: `CREATED: product was added with id:${id}`,
      });
    })
    .catch((e) => res.status(400).send(e));
});

// 5. Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id).
//    Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", (req, res) => {
  const unitPrice = Number(req.body.unit_price);
  const supplierId = Number(req.body.supplier_id);
  const productId = Number(req.body.product_id);

  if (
    unitPrice <= 0 ||
    !Number.isInteger(unitPrice) ||
    !Number.isInteger(supplierId) ||
    !Number.isInteger(productId)
  ) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: invalid input",
    });
  }

  const checkSupplierAndProductIdsExist = `
    select
      p.id,
      s.id
    from
      products AS p,
      suppliers AS s
    where
      p.id = $1
      and s.id = $2`;

  const insertNewAvailability = `
    INSERT INTO
      product_availability (prod_id, supp_id, unit_price)
    VALUES
      ($1, $2, $3)`;

  pool
    .query(checkSupplierAndProductIdsExist, [productId, supplierId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({
          result: "failure",
          message: `NOT FOUND: Product and/or supplier id's do not exist`,
        });
      } else {
        pool
          .query(insertNewAvailability, [productId, supplierId, unitPrice])
          .then(() => {
            res.status(201).json({
              result: "success",
              message: `CREATED: product availability`,
            });
          })
          .catch((e) => res.status(400).send(e));
      }
    })
    .catch((e) => res.status(400).send(e));
});

// 6. Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer.
//    Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = Number(req.params.customerId);
  const { orderDate, orderRef } = req.body;

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: invalid input",
    });
  }

  const addOrder = `
    INSERT INTO
      orders AS o (order_date, order_reference, customer_id)
    VALUES
      ($1, $2, $3)`;

  pool
    .query("SELECT * FROM orders WHERE customer_id = $1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({
          result: "failure",
          message: `NOT FOUND: Customer with id:${customerId} does not exist`,
        });
      } else {
        pool
          .query(addOrder, [orderDate, orderRef, customerId])
          .then(() => {
            res.status(201).json({
              result: "success",
              message: `CREATED: New order`,
            });
          })
          .catch((e) => res.status(400).send(e));
      }
    })
    .catch((e) => res.status(400).send(e));
});

// 7. Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  const { name, address, city, country } = req.body;

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: Invalid input type",
    });
  }

  const updateCustomersQuery = `
    UPDATE
      customers
    SET
      name = $1,
      address = $2,
      city = $3,
      country = $4
    WHERE
      id = $5`;

  pool
    .query(updateCustomersQuery, [name, address, city, country, customerId])
    .then((result) => {
      !result.rowCount
        ? res.status(400).json({
            result: "failure",
            message: `BAD REQUEST: Id:${customerId} not updated!`,
          })
        : res.status(200).json({
            result: "success",
            message: `OK: Details of customer with id:${customerId} updated!`,
          });
    })
    .catch((e) => res.status(400).send(e));
});

//8. Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", (req, res) => {
  const orderId = Number(req.params.orderId);

  if (!Number.isInteger(orderId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: Invalid input type",
    });
  }

  pool
    .query("DELETE FROM order_items WHERE order_id = $1", [orderId])
    .then((result) => {
      result.rowCount === 0
        ? res.status(400).json({
            result: "failure",
            message: `BAD REQUEST: Id:${orderId} not found!`,
          })
        : pool
            .query("DELETE FROM orders WHERE id = $1", [orderId])
            .then((result) => {
              result.rowCount === 0
                ? res.status(400).json({
                    result: "failure",
                    message: `BAD REQUEST: Id:${orderId} not deleted!`,
                  })
                : res.status(200).json({
                    result: "success",
                    message: `OK: Order with id:${orderId} deleted!`,
                  });
            })
            .catch((e) => res.status(500).send(e));
    })
    .catch((e) => res.status(500).send(e));
});

// 9. Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: Invalid input type",
    });
  }

  pool
    .query("select * FROM orders WHERE customer_id = $1", [customerId])
    .then((result) => {
      result.rowCount === 1
        ? res.status(200).json({
            result: "success",
            message: `OK: Customer with Id:${customerId} has items on order!`,
          })
        : pool
            .query("DELETE FROM customers WHERE id = $1", [customerId])
            .then((result) => {
              result.rowCount === 0
                ? res.status(400).json({
                    result: "failure",
                    message: `BAD REQUEST: Id:${customerId} not deleted!`,
                  })
                : res.status(200).json({
                    result: "success",
                    message: `OK: Order with id:${customerId} deleted!`,
                  });
            })
            .catch((e) => res.status(500).send(e));
    })
    .catch((e) => res.status(500).send(e));
});

//10. Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially,
//    the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = Number(req.params.customerId);

  if (!Number.isInteger(customerId)) {
    return res.status(400).json({
      result: "failure",
      message: "BAD REQUEST: Invalid input type",
    });
  }

  const orderDetailsQuery = `
  SELECT
    c.name,
    o.order_reference,
    o.order_date,
    p.product_name,
    pa.unit_price,
    s.supplier_name,
    oi.quantity
  from
    customers as c
    inner join orders as o on c.id = o.customer_id
    inner join order_items as oi on o.id = oi.order_id
    inner join product_availability as pa on oi.product_id = pa.prod_id
    inner join suppliers as s on pa.supp_id = s.id
    inner join products as p on oi.product_id = p.id
  where
    o.customer_id = $1;
`;

  pool
    .query(orderDetailsQuery, [customerId])
    .then((result) => {
      result.rows.length === 0
        ? res.status(200).json({
            result: "success",
            message: `BAD REQUEST: Customer with id:${customerId} has no orders`,
          })
        : res.status(200).json(result.rows);
    })
    .catch((e) => res.status(400).send(e));
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
