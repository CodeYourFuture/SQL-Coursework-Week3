require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {
  isValidId,
  isInjectionFree,
  isValidDate,
  isValidOrderReference,
} = require("./utils");

const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

// [2] Add a new GET endpoint `/customers` to return all the customers from the database
app.get("/customers", async (req, res) => {
  try {
    const queryGetCustomers = await db.query(
      `SELECT * 
      FROM customers;`
    );
    res.status(200).json({ success: true, data: queryGetCustomers.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new GET endpoint /customers/:customerId to load a single customer by ID.
app.get("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    if (!isValidId(customerId)) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} is not a valid integer`,
      });
    }

    const queryGetCustomerById = await db.query(
      `SELECT * 
      FROM customers 
      WHERE id = $1;`,
      [customerId]
    );

    if (queryGetCustomerById.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No customer with the id: ${customerId} was found`,
      });
    }
    res.status(200).json({ success: true, data: queryGetCustomerById.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [2] Add a new GET endpoint `/suppliers` to return all the suppliers from the database
app.get("/suppliers", async (req, res) => {
  try {
    const queryGetSuppliers = await db.query(
      `SELECT * 
      FROM suppliers;`
    );
    res.status(200).json({ success: true, data: queryGetSuppliers.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [2] Add a new GET endpoint `/products` to return all the product names along with their prices and supplier names.
// [3] Update the previous GET endpoint /products to filter the list of products by name using a query parameter, for example /products?name=Cup. This endpoint should still work even if you don't use the name query parameter!
app.get("/products", async (req, res) => {
  try {
    const productName = req.query.name;

    if (!productName) {
      const queryGetProducts = await db.query(
        `SELECT
          p.product_name,
          pa.unit_price,
          s.supplier_name
        FROM product_availability pa
        INNER JOIN products p
        ON (pa.prod_id = p.id)
        INNER JOIN suppliers s
        ON (pa.supp_id = s.id)
        ORDER BY p.product_name, pa.unit_price;`
      );

      return res
        .status(200)
        .json({ success: true, data: queryGetProducts.rows });
    }

    if (productName && !isInjectionFree(productName)) {
      return res
        .status(400)
        .json({ success: false, error: "You are attempting SQL Injection" });
    }

    const queryGetProductByName = await db.query(
      `SELECT
          p.product_name,
          pa.unit_price,
          s.supplier_name
        FROM product_availability pa
        INNER JOIN products p
        ON (pa.prod_id = p.id)
        INNER JOIN suppliers s
        ON (pa.supp_id = s.id)
        WHERE LOWER(p.product_name) LIKE '%' || LOWER($1) || '%'
        ORDER BY p.product_name, pa.unit_price;`,
      [productName]
    );

    if (queryGetProductByName.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No products with the name: ${productName} were found`,
      });
    }

    return res
      .status(200)
      .json({ success: true, data: queryGetProductByName.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new POST endpoint /customers to create a new customer with name, address, city and country.
app.post("/customers", async (req, res) => {
  try {
    const {
      name: newName,
      address: newAddress,
      city: newCity,
      country: newCountry,
    } = req.body;

    // this has issues because of blank spaces in user input...
    // if (
    //   !isInjectionFree(newName) ||
    //   !isInjectionFree(newAddress) ||
    //   !isInjectionFree(newCity) ||
    //   !isInjectionFree(newCountry)
    // ) {
    //   return res
    //     .status(400)
    //     .json({ success: false, error: "You may be attempting SQL Injection" });
    // }

    const queryGetCustomerByName = await db.query(
      `SELECT 1 
      FROM customers 
      WHERE LOWER(name) = $1;`,
      [newName.toLowerCase()]
    );

    if (queryGetCustomerByName.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Customer with name: ${newName} already exists`,
      });
    }

    const queryAddCustomer = await db.query(
      `INSERT INTO customers (name, address, city, country) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id;`,
      [newName, newAddress, newCity, newCountry]
    );

    const newId = queryAddCustomer.rows[0].id;

    res.status(200).json({
      success: true,
      message: `Customer CREATED, with id: ${newId}, name: ${newName}, address: ${newAddress}, city: ${newCity}, country: ${newCountry}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new POST endpoint /products to create a new product.
app.post("/products", async (req, res) => {
  try {
    const newProductName = req.body.productname;

    // this has issues because of blank spaces in user input...
    // if (!isInjectionFree(newProductName)) {
    //   return res.status(400).json({
    //     success: false,
    //     error: `${newProductName} is not a valid Product name (or you may be attempting SQL Injection)`,
    //   });
    // }

    if (!newProductName) {
      return res.status(400).json({
        success: false,
        error: `Please provide a product name.`,
      });
    }

    const queryGetProductByName = await db.query(
      `SELECT 1 
      FROM products 
      WHERE product_name = $1;`,
      [newProductName]
    );

    if (queryGetProductByName.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Product with name: ${newProductName} already exists`,
      });
    }

    const queryAddProduct = await db.query(
      `INSERT INTO products (product_name) 
      VALUES ($1) 
      RETURNING id;`,
      [newProductName]
    );

    const newId = queryAddProduct.rows[0].id;

    res.status(200).json({
      success: true,
      message: `Product CREATED, with id: ${newId}, with name: ${newProductName}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new POST endpoint /availability to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", async (req, res) => {
  try {
    const {
      productid: productId,
      supplierid: supplierId,
      unitprice: unitPrice,
    } = req.body;

    if (!isValidId(productId)) {
      return res.status(400).json({
        success: false,
        error: `The product id ${productId} must be a positive integer`,
      });
    }

    if (!isValidId(supplierId)) {
      return res.status(400).json({
        success: false,
        error: `The supplier id ${supplierId} must be a positive integer`,
      });
    }

    if (!parseInt(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: `The unit price ${unitPrice} must be a positive integer (not a float)`,
      });
    }

    const queryProductById = await db.query(
      `SELECT p.id 
      FROM products p  
      WHERE p.id = $1;`,
      [productId]
    );

    if (queryProductById.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `The product id ${productId} does not exist`,
      });
    }

    const querySupplierById = await db.query(
      `SELECT s.id 
      FROM suppliers s  
      WHERE s.id = $1;`,
      [supplierId]
    );

    if (querySupplierById.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `The supplier id ${supplierId} does not exist`,
      });
    }

    const queryProductByIdAndSupplierById = await db.query(
      `SELECT * 
      FROM product_availability 
      WHERE prod_id = $1 
      AND supp_id = $2;`,
      [productId, supplierId]
    );

    if (queryProductByIdAndSupplierById.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: `The product id ${productId} already exists for the supplier id ${supplierId}`,
      });
    }

    const queryAddProductAvailability = await db.query(
      `INSERT INTO product_availability (prod_id, supp_id, unit_price)
      VALUES ($1, $2, $3) 
      RETURNING id;`,
      [productId, supplierId, unitPrice]
    );

    const newId = queryAddProductAvailability.rows[0].id;

    res.status(200).json({
      success: true,
      message: `Product availablity CREATED, with id: ${newId} with product id: ${productId}, with supplier id: ${supplierId}, with unit price: ${unitPrice}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const { orderdate: newOrderDate, orderreference: newOrderReference } =
      req.body;

    if (!isValidId(customerId)) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} is not a valid integer`,
      });
    }

    if (!isValidDate(newOrderDate)) {
      return res.status(400).json({
        success: false,
        error: `Order date: ${newOrderDate} is not a valid date format (YYYY-MM-DD)`,
      });
    }

    if (!isValidOrderReference(newOrderReference)) {
      return res.status(400).json({
        success: false,
        error: `Order reference: ${newOrderReference} is not a valid format (ORD000)`,
      });
    }

    const queryCustomerId = await db.query(
      `SELECT * FROM customers WHERE id = $1;`,
      [customerId]
    );

    if (queryCustomerId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No Customer with id: ${customerId} found`,
      });
    }

    const queryInsert = await db.query(
      `INSERT INTO orders (order_date, order_reference, customer_id)
      VALUES($1, $2, $3) 
      RETURNING id`,
      [newOrderDate, newOrderReference, customerId]
    );

    const newId = queryInsert.rows[0].id;

    res.status(200).json({
      success: true,
      message: `Customer order CREATED, with id: ${newId}, with order date: ${newOrderDate}, with order reference: ${newOrderReference}, with customer id: ${customerId}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const {
      name: newName,
      address: newAddress,
      city: newCity,
      country: newCountry,
    } = req.body;

    if (!isValidId(customerId)) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} is not a valid integer`,
      });
    }

    if (!newName || !newAddress || !newCity || !newCountry) {
      return res.status(400).json({
        success: false,
        error: `One of: name, city, address or country are empty`,
      });
    }

    // this has issues because of blank spaces in user input...
    // if (
    //   !isInjectionFree(newName) ||
    //   !isInjectionFree(newAddress) ||
    //   !isInjectionFree(newCity) ||
    //   !isInjectionFree(newCountry)
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     error: `One of: name, city, address or country are not valid (or you may be attempting SQL Injections)`,
    //   });
    // }

    const queryCustomerId = await db.query(
      `SELECT * FROM customers WHERE id = $1;`,
      [customerId]
    );

    if (queryCustomerId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No Customer with id: ${customerId} found`,
      });
    }

    const insertQuery = await db.query(
      `UPDATE customers
      SET name = $1, address = $2, city = $3, country = $4
      WHERE id = $5`,
      [newName, newAddress, newCity, newCountry, customerId]
    );
    // console.log(insertQuery);

    res.status(200).json({
      success: true,
      message: `Customer id: ${customerId} UPDATED, with name: ${newName}, with address: ${newAddress}, with city: ${newCity}, with country: ${newCountry}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new DELETE endpoint /orders/:orderId to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!isValidId(orderId)) {
      return res.status(400).json({
        success: false,
        error: `Order id: ${orderId} is not a valid integer`,
      });
    }

    const queryOrderId = await db.query(
      `SELECT 1 
      FROM orders
      WHERE id = $1`,
      [orderId]
    );

    if (queryOrderId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No Order with id: ${orderId} found`,
      });
    }

    const queryDeletOrderItems = await db.query(
      `DELETE 
      FROM order_items 
      WHERE order_id = $1`,
      [orderId]
    );
    // console.log("queryDeletOrderItems:", queryDeletOrderItems);

    const queryDeleteOrder = await db.query(
      `DELETE 
      FROM orders 
      WHERE id = $1`,
      [orderId]
    );
    // console.log("queryDeleteOrder:", queryDeleteOrder);

    res.status(200).json({
      success: true,
      message: `Order id: ${orderId} DELETED, and associated order items`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new DELETE endpoint /customers/:customerId to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    if (!isValidId(customerId)) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} is not a valid integer`,
      });
    }

    const queryCustomerId = await db.query(
      `SELECT * 
      FROM customers 
      WHERE id = $1`,
      [customerId]
    );

    if (queryCustomerId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `No Customer with id: ${customerId} found`,
      });
    }

    const queryOrdersWithCustomerId = await db.query(
      `SELECT * 
      FROM orders
      WHERE customer_id = $1;`,
      [customerId]
    );
    // console.log("queryOrdersWithCustomerId:", queryOrdersWithCustomerId);

    if (queryOrdersWithCustomerId.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} has Orders`,
      });
    }

    const queryDeleteCustomer = await db.query(
      `DELETE
      FROM customers
      WHERE id = $1`,
      [customerId]
    );
    // console.log("queryDeleteCustomer:", queryDeleteCustomer);

    res.status(200).json({
      success: true,
      message: `Customer id: ${customerId} DELETED`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// [3] Add a new GET endpoint /customers/:customerId/orders to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
app.get("/customers/:customerId/orders", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const queryCustomerOrders = await db.query(
      `SELECT 
        o.customer_id, 
        o.order_reference, 
        o.order_date, 
        p.product_name, 
        s.supplier_name, 
        pa.unit_price, 
        oi.quantity 
      FROM orders o 
      INNER JOIN order_items oi 
      ON o.id = oi.order_id 
      INNER JOIN product_availability pa 
      ON oi.product_id = pa.prod_id 
      AND oi.supplier_id = pa.supp_id
      INNER JOIN products p 
      ON pa.prod_id = p.id 
      INNER JOIN suppliers s 
      ON pa.supp_id = s.id 
      WHERE o.customer_id = $1;`,
      [customerId]
    );

    if (queryCustomerOrders.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `Customer id: ${customerId} has no orders`,
      });
    }

    res.status(200).json({ success: true, data: queryCustomerOrders.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// Root route serving the index page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "./public/index.html");
});

app.listen(3000, () => {
  console.log("The server is running on port 3000");
});
