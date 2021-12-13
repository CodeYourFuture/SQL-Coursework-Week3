const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  user: "Maha",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "coder2021",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT name FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT name FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/suppliers", function (req, res) {
  pool.query("SELECT supplier_name FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", function (req, res) {
  let nameQuery = req.query.name;
  dBQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";

  //if name query used, returns only results matching the name value
  if (nameQuery) {
    dBQuery += ` WHERE product_name LIKE '%${nameQuery}%' ORDER BY product_name`;
  }

  pool
    .query(dBQuery)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});


// POST REQUESTS---------------------

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAdd = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName) {
    return res.status(400).send("Please enter customer name");
  }
  pool
    .query("SELECT name FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Customer name is already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAdd,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("customer added"))
          .catch((e) => console.error(e));
      }
    });
});

// -----------------

// app.post("/availability", function (req, res) {
//   const productId = req.body.prodId;
//   const suppId = req.body.suppId;
//   const price = req.body.price;

//   if (!Number.isInteger(price) || price <= 0) {
//     return res.status(400).send("Please enter a positive price");
//   }

//   pool.query(
//     "SELECT products.id, suppliers.id FROM products, suppliers WHERE p.id=$1 AND s.id=$2", [productId, suppId])
//     .then(
//       (result) => {
//         if (result.rows.length < 1) {
//           return res.status(400).send("Product doesn't exist!");
//         } else {
//           const query =
//             "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
//           pool
//             .query(query, [productId, suppId, price])
//             .then(() => res.send("availability added"))
//             .catch((e) => console.error(e));
//         }
//       }
//     );
// });


app.post("/availability", (req, res) => {
  const productId = req.body.prodId;
  const newPrice = req.body.price;
  const supplierId = req.body.supplierId;
  if (newPrice <= 0) {
    return res.status(404).send("Invalid pricing option");
  }
  pool
    .query(
      "SELECT products.id, suppliers.id FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers on suppliers.id = product_availability.supp_id WHERE products.id=$1 OR suppliers.id=$2",
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Product or Supplier doesn't exist");
      } else {
        pool.query(
          "INSERT INTO product_availability (prod_id, unit_price, supp_id) VALUES ($1, $2, $3)",
          [productId, newPrice, supplierId],
          (err, result) => {
            if (!err) {
              res
                .status(200)
                .send("New product availability added")
                .json(result.rows);
            } else {
              res.status(400);
              console.error(err);
            }
          }
        );
      }
    });
});
// ----------------------------------
//insert prod_id,unit_price & supp_id -Donee
//Check that the price is a positive integer -Done
//Check both the productID and supplier ID's exist in the database,
// otherwise return an error.
//UNSURE OF WHAT NEEDS RETURNING
//Adding both statements in pool.query didn't work ----  FROM product_availability WHERE prod_id=$1 OR supp_id = $2"

// app.post("/availability", function (req, res) {
//   const newProductId = req.body.prodId;
//   const newSuppId = req.body.suppId;
//   const newPrice = req.body.price;


//   if (!Number.isInteger(newPrice) || newPrice <= 0) {
//     return res.status(400).send("Please enter a positive price");
//   }

//   pool
//     .query(
//       "SELECT * FROM products WHERE id=$1", [newProductId]
//     )
//     .then((result) => {
//       if (result.rows.length < 1) {
//         return res.status(400).send("Product doesn't exist!");
//       } else {
//         const query =
//           "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
//         pool
//           .query(query, [newProductId, newSuppId, newPrice])
//           .then(() => res.send("availability added"))
//           .catch((e) => console.error(e));
//       }
//     });
// });

// ---------------
// copy of availability post req

// app.post("/availability", function (req, res) {
//   const newProductId = req.body.prodId;
//   const newSuppId = req.body.suppId;
//   const newPrice = req.body.price;

//   if (!Number.isInteger(newPrice) || newPrice <= 0) {
//     return res.status(400).send("Please enter a positive price");
//   }

//   pool
//     .query("SELECT * FROM products WHERE id=$1", [newProductId])
//     .then((result) => {
//       if (result.rows.length < 1) {
//         return res.status(400).send("Product doesn't exist!");
//       } else {
//         const query =
//           "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
//         pool
//           .query(query, [newProductId, newSuppId, newPrice])
//           .then(() => res.send("availability added"))
//           .catch((e) => console.error(e));
//       }
//     });
// });



app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
