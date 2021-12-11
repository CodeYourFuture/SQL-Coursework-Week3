const express = require("express");
const app = express();
app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "asif",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "786god",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => {
      if (result) {
        res.status(200).json(result.rows);
      } else res.status(400).send("Couldn't retrieve");
    })
    .catch((e) => console.error(e));
});
app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  const query =
    "SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, oi.quantity  FROM orders o INNER JOIN order_items oi ON o.id = oi.order_id INNER JOIN products p ON oi.product_id = p.id INNER JOIN product_availability pa ON oi.product_id = pa.prod_id INNER JOIN suppliers s ON oi.supplier_id = s.id WHERE customer_id = $1";

  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});
app.post("/customers/:customerId/orders", function (req, res) {
  const newCustomerID = req.params.customerId;
  const newOrderDate = req.body.order_date;
  const NewOrderRef = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE customers.id=$1", [newCustomerID])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("No customer with this id exists!");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id)VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, NewOrderRef, newCustomerID])
          .then(() => res.send("new order created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.get("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers where customers.id =$1", [
      Number(customerId),
    ])
    .then((result) => {
      if (result) res.status(200).json(result.rows);
      else res.status(400).send("Couldn't retrieve");
    })
    .catch((e) => console.error(e));
});

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  pool
    .query("SELECT * FROM customers where customers.id =$1", [
      Number(customerId),
    ])
    .then((result) => {
      if (result.rowCount === 0) res.status(400).send("customer doesn't exist");
      else {
        const query =
          "update customers set name=$1,address=$2,city=$3,country=$4 where id= $5";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
            customerId,
          ])
          .then((result) => res.send("customer updated!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  if (
    !newCustomerName ||
    !newCustomerCity ||
    !newCustomerCountry ||
    !newCustomerAddress
  ) {
    return res.status(400).send("Please enter name,address,city and country");
  }
  pool
    .query(
      "SELECT * FROM customers WHERE customers.address=$1 AND customers.name=$2 And customers.city=$3  And  customers.country=$4",
      [newCustomerAddress, newCustomerName, newCustomerCity, newCustomerCountry]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name,address,city,country) VALUES ($1, $2, $3,$4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("customer created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/products", function (req, res) {
  const newProductName = req.body.name;
  if (!newProductName) {
    return res.status(400).send("Please enter Product name");
  }

  pool
    .query("SELECT * FROM products WHERE products.product_name=$1", [
      newProductName,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/availability", function (req, res) {
  const newProductID = req.body.prod_id;
  const newSupplierID = req.body.supp_id;
  const newUnitPrice = req.body.unit_price;

  if (newUnitPrice <= 0) {
    return res.status(400).send("Please enter valid price");
  }

  pool
    .query(
      "SELECT p.id, s.id FROM  products p,suppliers s WHERE p.id=$1 and s.id=$2",
      [newProductID, newSupplierID]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Product or Supplier does not Exist");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

        pool
          .query(query, [newProductID, newSupplierID, newUnitPrice])
          .then(() => res.send("Product availability added"))
          .catch((e) => console.error(e));
      }
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => {
      if (result) res.status(200).json(result.rows);
      else res.status(400).send("Couldn't retrieve");
    })
    .catch((e) => console.error(e));
});

app.get("/products", function (req, res) {
  let product_name;
  if (req.query.name) {
    product_name = req.query.name.toLowerCase();
    pool
      .query(
        "select products.product_name, product_availability.unit_price,suppliers.supplier_name from products inner join product_availability on products.id=product_availability.prod_id inner join suppliers on product_availability.supp_id=suppliers.id where LOWER(products.product_name) like $1",
        ["%" + product_name + "%"]
      )
      .then((result) => {
        if (result) res.status(200).json(result.rows);
        else res.status(400).send("Couldn't retrieve");
      })
      .catch((e) => console.error(e));
  } else {
    pool
      .query(
        "select products.product_name, product_availability.unit_price,suppliers.supplier_name from products inner join product_availability on products.id=product_availability.prod_id inner join suppliers on product_availability.supp_id=suppliers.id"
      )
      .then((result) => {
        if (result) res.status(200).json(result.rows);
        else res.status(400).send("Couldn't retrieve");
      })
      .catch((e) => console.error(e));
  }
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rowCount !== 0) {
        res.status(400).send(`Delete not allowed for customer ${customerId}`);
      } else {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send(`customer ${customerId} deleted`))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("select FROM order_items WHERE order_id=$1", [orderId])
    .then((result) => {
      if (result.rowCount === 0) {
        res.status(400).send(`Delete not allowed for order ${orderId}`);
      } else {
        pool
          .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
          .then(() => res.send(`order ${orderId} deleted`))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

app.listen(4000, function () {
  console.log("Server is listening on port 4000. Ready to accept requests!");
});
