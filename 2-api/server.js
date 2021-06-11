const express = require("express");
const {Pool} = require("pg");
const app = express();
const dbConfig = {
  host: "localhost",
  port: 5432,
  user: "DELL",
  password: "87654321",
  database: "cyf_ecommerce",
};
const pool = new Pool(dbConfig);

const customerSelectQuery = `SELECT * FROM customers `;
const customerSelectByIdQuery = `SELECT * FROM customers WHERE id = $1`;
const productsSelectQuery = `SELECT product_name,supplier_name,unit_price FROM products 
INNER JOIN product_availability on products.id=product_availability.prod_id
INNER JOIN suppliers on product_availability.supp_id=suppliers.id;
`;

// Validators

function isValidID(id) {
  return !isNaN(id) && id >= 0;
}

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(productsSelectQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Customers
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query(customerSelectQuery);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});
//  one customer
app.get("/customers/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (!isValidID(id)) {
    res.status(404).send({Msg: "Customer not found"});
  } else {
    pool
      .query(customerSelectByIdQuery, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          res.status(404).send({Msg: "Customer not found"});
        } else {
          res.send(result.rows[0]);
        }
      })
      .catch((error) => res.status(500).send(error));
  }
});

// selected customer orders
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const orderQuery = `SELECT o.id, o.order_reference, o.order_date, p.product_name, oi.quantity
  FROM order_items As oi
  INNER JOIN  orders As o ON  oi.order_id = o.id
  INNER JOIN  customers As c ON  o.customer_id = c.id
 INNER JOIN  products As p ON  oi.product_id = p.id
 INNER JOIN  product_availability As pa ON  pa.prod_id = p.id
    WHERE c.id = $1`;

  pool
    .query(orderQuery, [customerId])
    .then((result) => {
      if (result.rowCount > 0) {
        return res.status(200).send(result.rows);
      }
      res.status(404).send("Incorrect Customer ID");
    })
    .catch((err) => console.log(err));
});

// new customer
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    !newCustomerName ||
    !newCustomerAddress ||
    !newCustomerCity ||
    !newCustomerCountry
  ) {
    return res.status(400).send("All fields are required.");
  }

  const query =
    "INSERT INTO hotels (name, address, city, country) VALUES ($1, $2, $3)";
  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => res.send("Customer created!"))
    .catch((e) => console.error(e));
});
// new orders for a customer
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const newOrderDate = req.body.order_date;
  const newOrderRef = req.body.order_reference;

  if (!newOrderRef.includes("ORD")) {
    return res.status(400).send("Enter order reference in valid format ORDXXX");
  }

  pool
    .query(`select * from customer where id=$1`, [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res
          .status(400)
          .send("No, customer found, invalid is or customer doesn't exist");
      } else {
        pool
          .query(
            "insert into orders (order_date, order_reference, customer_id) values ($1, $2, $3)",
            [newOrderDate, newOrderRef, customerId]
          )
          .then(() => res.send({Msg: "Order created successfully"}));
      }
    });
});

// new products
app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;

  if (!newProductName) {
    return res.status(400).send("Product Name is required");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Product exists.");
      } else {
        const productPostQuery =
          "INSERT INTO products (product_name) VALUES ($1);";

        pool
          .query(productPostQuery, [newProductName])
          .then(() => res.send("Product Created!"))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

app.post("/availability", (req, res) => {
  const newProductId = parseInt(req.body.prodId);
  const newSupplierId = parseInt(req.body.suppId);
  const newUnitPrice = parseFloat(req.body.unitPrice);

  if (!newProductId || !newSupplierId || !newUnitPrice) {
    return res.status(400).send("All  fields required");
  }
  if (
    !Number.isInteger(newProductId) ||
    !Number.isInteger(newSupplierId) ||
    !Number.isInteger(newUnitPrice)
  ) {
    return res.status(400).send("All  fields should be postive numbers");
  }

  // checks one by one
  pool
    .query("SELECT id FROM products WHERE id=$1", [newProductId])
    .then((result) => {
      if (result.rowCount > 0) {
        pool
          .query("SELECT id FROM suppliers WHERE id=$1", [newSupplierId])
          .then((result) => {
            if (result.rowCount > 0) {
              pool
                .query(
                  "SELECT unit_price FROM product_availability WHERE prod_id=$1 AND supp_id=$2;",
                  [newProductId, newSupplierId]
                )
                .then((result) => {
                  if (result.rowCount > 0) {
                    return res.status(400).send("Product Already Exists");
                  }
                  pool
                    .query(
                      "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);",
                      [newProductId, newSupplierId, newUnitPrice]
                    )
                    .then(() => res.send("Product-Availability Created!"))
                    .catch((e) => console.error(e));
                })
                .catch((e) => console.error(e));
            } else {
              return res.status(400).send("Invalid Supplier ID");
            }
          })
          .catch((e) => console.error(e));
      } else {
        return res.status(400).send("Invalid Product ID");
      }
    })
    .catch((e) => console.error(e));
});

// updating a customer
app.put("/customers/:customerId", function (req, res) {
  const newCustomerId = req.body.customerId;
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (
    !newCustomerName ||
    !newCustomerAddress ||
    !newCustomerCity ||
    !newCustomerCountry
  ) {
    return res.status(400).send("All fields are required.");
  }

  pool
    .query(
      "update customers set name=$1, address=$2, city=$3, country=$4 where id=$5;",
      [
        newCustomerName,
        newCustomerAddress,
        newCustomerCity,
        newCustomer,
        newCustomerId,
      ]
    )
    .then(() => res.send(`Customer ${customerId} updated.`))
    .catch((e) => console.error(e));
});

// deleting orders with Id
app.delete("/orders/:orderId", (req, res) => {
  const orderId = parseInt(req.params.orderId);

  pool
    .query("delete from order_items where order_id = $1;", [orderId])
    .then(() => {
      pool
        .query("delete from orders where order_id;", [orderId])
        .then(() => res.send(`Order ${orderId} deleted`))
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
});

// deleting customer by id
app.delete("/customers/:customerId", (req, res) => {
  const customerId = parseInt(req.params.customerId);

  pool
    .query("select from orders where customer_id = $1;", [customerId])
    .then((result) => {
      if (result.count > 0) {
        return res.status(400).send("Customers has orders");
      }
      pool
        .query("delete from customers where id = $1;", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted`))
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
});

app.listen(3000, () => {
  console.log(" Server running on port 3000");
});
