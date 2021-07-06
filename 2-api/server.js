const express = require('express');
const app = express();
const { Pool } = require('pg');
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const myPass = process.env.PASSWORD;
const myUser = process.env.USERNAME;
const myHost = process.env.HOST;
const myDatabase = process.env.DATABASE;
const myDB_Port = process.env.DB_PORT;
const PORT = process.env.PORT || 3000;

const pool = new Pool({
	user: myUser,
	password: myPass,
	host: myHost,
	database: myDatabase,
	port: myDB_Port
})

app.get('/customers', (req, res) => {
	pool.query('SELECT * FROM customers', (dbError, dbResult) => res.json(dbResult.rows));
})

app.get('/suppliers', (req, res) => {
	pool.query('SELECT * FROM suppliers', (dbError, dbResult) => res.json(dbResult.rows));
})

app.get('/products', (req, res) => {
	const getAllProducts = `SELECT supplier_name, product_name, unit_price 
	FROM products INNER JOIN product_availability ON products.id=product_availability.prod_id 
	INNER JOIN suppliers ON suppliers.id=product_availability.supp_id`;

	const searchBy = req.query.name;

	if (searchBy) {
		pool.query(`${getAllProducts} WHERE product_name ~* $1`, [searchBy], (dbError, dbResult) => res.json(dbResult.rows));
	} else {
		pool.query(getAllProducts, (dbError, dbResult) => res.json(dbResult.rows));
	}
});

app.get('/customers/:customerID', (req, res) => {
	const id = req.params.customerID;

	const getCustomerByID = `SELECT * FROM customers WHERE id=$1`;

	pool.query(getCustomerByID, [id], (dbError, dbResult) => res.json(dbResult.rows));
})

app.post('/customers', (req, res) => {
	const { name, address, city, country } = req.body;

	const checkIfCustomersExists = `SELECT * FROM customers 
	WHERE name=$1 AND address=$2 AND city=$3 AND country=$4`;

	const insertNewCustomer = `INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)`;

	if (!name || !address || !city || !country) {
		res.status(400).send('Please fill all the required fields');
	} else {
		pool.query(checkIfCustomersExists, [name, address, city, country], (dbError, dbResult) => {
			if (dbResult.rows.length > 0) {
				res.status(400).send('This customers already exists')
			} else {
				pool.query(insertNewCustomer, [name, address, city, country], () => res.status(200).send(`Customer with name ${name} created`));
			}
		})
	}
})

app.post('/products', (req, res) => {
	const prodName = req.body.name;

	const checkIfProductExists = `SELECT * FROM products WHERE product_name=$1`;

	const insertNewProduct = `INSERT INTO products (product_name) VALUES ($1)`;

	if (!prodName) {
		res.status(400).send("Please enter a product name");
	} else {
		pool.query(checkIfProductExists, [prodName], (dbError, dbResult) => {
			if (dbResult.rows.length > 0) {
				res.status(400).send('This product already exists')
			} else {
				pool.query(insertNewProduct, [prodName], () => res.status(200).send(`Product with the name: ${prodName} was added`));
			}
		})
	}
})

app.post('/availability', (req, res) => {
	const { productID, supplierID, unitPrice } = req.body;
	const checkSupplierID = `SELECT * FROM suppliers WHERE id=$1;`;
	const checkProductID = `SELECT * FROM products WHERE id=$1;`;
	const updateProductAvailability = `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);`;

	if (!productID || !supplierID || !unitPrice || unitPrice < 0) {
		res.status(400).send('Please fill all the required fields and unit price is greater than 0');
	} else {
		pool.query(checkProductID, [productID], (dbError, dbResult) => {
			if (dbResult.rows.length === 0) {
				res.status(400).send('There is no product with that ID');
			} else {
				pool.query(checkSupplierID, [supplierID], (dbError, dbResult) => {
					if (dbResult.rows.length === 0) {
						res.status(400).send('There is no supplier with that ID');
					} else {
						pool.query(updateProductAvailability, [productID, supplierID, unitPrice], () => res.status(200).send('Product availability updated'));
					}
				});
			}
		});
	}
})

app.post('/customers/:customerID/orders', (req, res) => {
	const { customerID } = req.params;
	const getYear = new Date().getFullYear();
	const getMonth = new Date().getMonth() + 1;
	const getDay = new Date().getDate();
	const orderDate = `${getYear}-${getMonth}-${getDay}`;
	const { orderReference } = req.body;
	const checkCustomerID = `SELECT * FROM customers WHERE id=$1`;
	const checkOrderReference = `SELECT * FROM orders WHERE order_reference=$1`;

	const addNewOrder = `INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)`;
	pool.query(checkCustomerID, [customerID], (dbError, dbResult) => {
		if (dbResult.rows.length === 0) {
			res.status(400).send('There is no customer with that id');
		} else {
			pool.query(checkOrderReference, [orderReference], (dbError, dbResult) => {
				if (dbResult.rows.length === 0) {
					pool.query(addNewOrder, [orderDate, orderReference, customerID], () => res.status(200).send('New order added'));
				} else {
					res.status(400).send('This order reference already exists')
				}
			})
		}
	});
})

app.put('/customers/:customerID', (req, res) => {
	const { customerID } = req.params;
	const { name, address, city, country } = req.body;
	const checkCustomerID = `SELECT * FROM customers WHERE id=$1`;
	const valuesToUpdateObj = {};

	if (name) {
		valuesToUpdateObj.name = name;
	}
	if (address) {
		valuesToUpdateObj.address = address;
	}
	if (city) {
		valuesToUpdateObj.city = city;
	}
	if (country) {
		valuesToUpdateObj.country = country;
	}

	const queryArray = [];
	const valuesArray = [];
	for (const key in valuesToUpdateObj) {
		valuesArray.push(valuesToUpdateObj[key]);

		queryArray.push(`${key}=$${valuesArray.length}`)
	}

	const updateCustomer = `UPDATE customers SET ${queryArray.join(', ')} WHERE id=$${valuesArray.length + 1}`;

	pool.query(checkCustomerID, [customerID], (dbError, dbResult) => {
		if (dbResult.rows.length === 0) {
			res.status(400).send('There is no customer with that id');
		} else {
			pool.query(updateCustomer, [...valuesArray, customerID], () => res.status(200).send(`Customer with the id: ${customerID} has been updated`));
		}
	})
})


app.listen(PORT, () => console.log(`Server running on ${PORT}`))