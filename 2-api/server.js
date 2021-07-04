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
	pool.query('SELECT * FROM customers', (dbError, dbResult) => {
		res.json(dbResult.rows)
	})
})

app.get('/suppliers', (req, res) => {
	pool.query('SELECT * FROM suppliers', (dbError, dbResult) => {
		res.json(dbResult.rows);
	})
})

app.get('/products', (req, res) => {
	const getAllProducts = `SELECT supplier_name, product_name, unit_price 
	FROM products INNER JOIN product_availability ON products.id=product_availability.prod_id 
	INNER JOIN suppliers ON suppliers.id=product_availability.supp_id`;
	const searchBy = req.query.name;

	if (searchBy) {
		pool.query(`${getAllProducts} WHERE product_name ~* '${searchBy}'`, (dbError, dbResult) => {
			res.json(dbResult.rows);
		})
	} else {
		pool.query(getAllProducts, (dbError, dbResult) => {
			res.json(dbResult.rows);
		})
	}
});

app.get('/customers/:customerID', (req, res) => {
	const id = req.params.customerID;
	const getCustomerByID = `SELECT * FROM customers WHERE id=${id}`;
	pool.query(getCustomerByID, (dbError, dbResult) => {
		res.json(dbResult.rows);
	})
})

app.post('/customers', (req, res) => {
	const { name, address, city, country } = req.body;
	const insertNewCustomer = `INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)`;
	// if()
	pool.query(insertNewCustomer, [name, address, city, country], () => {
		res.status(200).json({
			status: "success",
			data: `Customer with name ${name} created`
		});
	})
})



app.listen(PORT, () => console.log(`Server running on ${PORT}`))