const express = require('express');
const app = express();
app.use(express.json());
const { Pool } = require('pg');

const pool = new Pool({
	user: 'ivanzhukov',
	host: 'localhost',
	database: 'cyf_ecommerce',
	password: '',
	port: 5432,
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log('Server running on port', PORT);
});

app.get('/', (req, res) => {
	res.status(200).send('OK!');
});

app.get('/customers', (req, res) => {
	pool.query('select * from customers').then((result) => {
		res.status(200).json(result.rows);
	});
});

app.get('/suppliers', (req, res) => {
	pool.query('select * from suppliers').then((result) => {
		res.status(200).json(result.rows);
	});
});

app.get('/products', (req, res) => {
	let queryString = `select
				products.product_name,
				product_availability.unit_price, 
				suppliers.supplier_name
					from products
						join product_availability on product_availability.prod_id = products.id
						join suppliers on product_availability.supp_id = suppliers.id`;
	const name = req.query.name;
	if (name) {
		queryString =
			queryString +
			` where lower(products.product_name) like lower('%${name}%')`;
		pool.query(queryString).then((result) => {
			res.status(200).json(result.rows);
		});
		return;
	}
	pool.query(queryString).then((result) => {
		res.status(200).json(result.rows);
	});
});

// Customers by ID
app.get('/customers/:customerId', (req, res) => {
	const customerId = req.params.customerId;
	pool
		.query(`select * from customers where id = ${customerId}`)
		.then((result) => {
			res.status(200).json(result.rows);
		});
});

app.post('/customers', (req, res) => {
	const id = req.body.id;
	const name = req.body.name;
	const address = req.body.address;
	const city = req.body.city;
	const country = req.body.country;

	pool
		.query(
			`insert into customers 
				(id, name, address, city, country) values
				($1, $2, $3, $4, $5)`,
			[id, name, address, city, country]
		)
		.then((result) => {
			res.status(202).json(result.rows);
		});
});

app.post('/products', (req, res) => {
	const productName = req.body.product_name;
	const price = req.body.unit_price;
	const supplierName = req.body.supplier_name;

	pool
		.query(
			`insert into products
				(product_name) values
				($1)`,
			[productName]
		)
		.then((result) => res.status(202).json(result.rows));
});
