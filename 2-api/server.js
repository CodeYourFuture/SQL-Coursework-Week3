const express = require('express')
const { Pool } = require('pg')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT || 4000

const dbConfig = {
	host: process.env.host,
	port: process.env.port,
	user: process.env.user,
	password: process.env.password,
	database: process.env.database,
}

const pool = new Pool(dbConfig)
app.use(express.json())

const customersQuery = 'SELECT * FROM customers'
const suppliersQuery = 'SELECT * FROM suppliers'
const productsQuery = 'SELECT * FROM products'

const isValid = (n) => {
	return !isNaN(n) && n >= 0
}

//* An Updated GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint still works even if you don't use the `name` query parameter!

app.get('/products', async (req, res) => {
	const productNameQuery = req.query.name
	if (productNameQuery) {
		let query = 'SELECT * FROM products WHERE product_name=$1'
		try {
			const result = await pool.query(query, [productNameQuery])
			res.json(result.rows)
		} catch (error) {
			res.status(500).send(error)
		}
	} else
		try {
			const result = await pool.query(productsQuery)
			res.json(result.rows)
		} catch (error) {
			res.status(500).send(error)
		}
})

//* A Get endpoint `/customers` to load all the customers

app.get('/customers', async (req, res) => {
	try {
		const result = await pool.query(customersQuery)
		res.json(result.rows)
	} catch (error) {
		res.status(500).send(error)
	}
})

//* A GET endpoint `/customers/:customerId` to load a single customer by ID.

app.get('/customers/:customerId', (req, res) => {
	const customerId = req.params.customerId
	const query = `SELECT * FROM customers WHERE id=${customerId}`
	const checkIfExists = `select exists(select 1 from customers where id=${id})`
	if (!isValid) {
		res.status(400).json({ 'Server message': 'Invalid id!' })
	} else {
		pool.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()
			if (!doesExist) {
				res.status(404).json({
					'Server message': `A customer by the id ${id} does not exist!`,
				})
			} else {
				pool
					.query(query)
					.then((result) => res.json(result.rows))
					.catch((e) => console.error(e))
			}
		})
	}
})

//* A POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post('/customers', async (req, res) => {
	const name = req.body.name
	const address = req.body.address
	const city = req.body.city
	const country = req.body.country
	const customersInsertQuery =
		'INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)'
	try {
		await pool.query(customersInsertQuery, [name, address, city, country])
		res.json({
			Success: `Customer by the name ${name} is successfully registered!`,
		})
	} catch (error) {
		res.status(500).send(error)
	}
})

//* A POST endpoint `/products` to create a new product.

app.post('/products', async (req, res) => {
	const productName = req.body.product_name
	const productsInsertQuery = 'INSERT INTO products (product_name) VALUES ($1)'
	try {
		await pool.query(productsInsertQuery, [productName])
		res.json({
			Success: `Product by the name ${productName} is successfully inserted!`,
		})
	} catch (error) {
		res.status(500).send(error)
	}
})

//* A POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post('/availability', async (req, res) => {
	let supplierId = req.body.supp_id
	let productId = req.body.prod_id
	let price = req.body.unit_price
	const availabilityInsertQuery =
		'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);'
	const existsQuery =
		'select exists(select 1 from product_availability where supp_id=$1 AND prod_id=$2);'
	const supplierExistsQuery =
		'select exists(select 1 from suppliers where id=$1);'
	const productsExistsQuery =
		'select exists(select 1 from products where id=$1);'

	if (!isValid(supplierId) || !isValid(productId) || !isValid(price)) {
		res.sendStatus(400)
	} else if (isValid(supplierId) && isValid(productId) && isValid(price)) {
		try {
			const result = await pool.query(existsQuery, [supplierId, productId])
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()

			const suppliersResult = await pool.query(supplierExistsQuery, [
				supplierId,
			])
			const supplierExists = suppliersResult.rows.map((el) => el.exists)
			let doesSupplierExist = supplierExists.pop()

			const productsResult = await pool.query(productsExistsQuery, [productId])
			const productExists = productsResult.rows.map((el) => el.exists)
			let doesProductExist = productExists.pop()

			if (doesExist) {
				res.status(400).send('Availability already exists!')
			} else if (!doesSupplierExist) {
				res.status(400).send('Supplier does not exist')
			} else if (!doesProductExist) {
				res.status(400).send('Product does not exist!')
			} else {
				pool
					.query(availabilityInsertQuery, [productId, supplierId, price])
					.then(() => res.sendStatus(201))
					.catch((error) => console.error(error))
			}
		} catch (error) {
			res.status(500).send(error)
		}
	}
})

//* A POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. It checks that the customerId corresponds to an existing customer or returns an error.

app.post('/customers/:customerId/orders', async (req, res) => {
	const customerId = req.params.customerId
	const orderDate = req.body.order_date
	const orderReference = req.body.order_reference
	const existsQuery = 'select exists(select 1 from orders where customer_id=$1)'
	const customerOrderQuery =
		'INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)'

	if (!isValid(customerId)) {
		res.sendStatus(400)
	} else {
		try {
			const result = await pool.query(existsQuery, [customerId])
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()
			console.log(doesExist)
			if (!doesExist) {
				res.sendStatus(404)
			} else {
				pool
					.query(customerOrderQuery, [orderDate, orderReference, customerId])
					.then((result) =>
						res.json({ Success: `Order is successfully inserted!` })
					)
					.catch((error) => console.error(error))
			}
		} catch (error) {
			res.status(500).send(error)
		}
	}
})

//* A PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put('/customers/:customerId', (req, res) => {
	const customerId = req.params.customerId
	const name = req.body.name
	const address = req.body.address
	const city = req.body.city
	const country = req.body.country

	pool
		.query(
			'UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5',
			[name, address, city, country, customerId]
		)
		.then(() => res.send(`Customer ${customerId} is updated!`))
		.catch((e) => console.error(e))
})

//! A DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

app.delete('/orders/:orderId', (req, res) => {
	const id = req.params.orderId
	const checkIfExists = `select exists(select 1 from orders where id=${id})`
	const deleteItemsQuery = `DELETE FROM order_items WHERE order_id=${id};`
	const deleteQuery = `DELETE FROM orders WHERE  id = ${id}`

	if (!isValid(id)) {
		res.status(404).json({
			Server: `The provided order id: ${id} is invalid!`,
		})
	} else {
		pool.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()
			if (!doesExist) {
				res.status(404).json({
					'Server message': `An order by the id ${id} does not exist!`,
				})
			} else {
				pool
					.query(deleteItemsQuery)
					.then(() => pool.query(deleteQuery))
					.then(() =>
						res.json({
							Server: `An order by the id: ${id} is successfully deleted!`,
						})
					)
					.catch((err) => console.error(err))
			}
		})
	}
})

//! A DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

app.delete('/customers/:customerId', (req, res) => {
	const id = req.params.customerId
	const checkIfExists = `select exists(select 1 from customers where id=${id})`
	const deleteQuery = `DELETE FROM customers WHERE id = ${id} AND NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id=customers.id)`
	const checkIfOrdered = `SELECT * FROM customers WHERE id = ${id} AND EXISTS (SELECT 1 FROM orders WHERE orders.customer_id=customers.id);`

	if (!isValid(id)) {
		res.status(404).json({
			Server: `The provided customer id: ${id} is invalid!`,
		})
	} else {
		pool.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()
			if (!doesExist) {
				res.status(404).json({
					'Server message': `A customer by the id ${id} does not exist!`,
				})
			} else {
				pool.query(checkIfOrdered).then((result) => {
					if (result.rows.length > 0) {
						res.json({
							'Server message': `A customer by the id ${id} has orders and can not be deleted!`,
						})
					} else {
						pool
							.query(deleteQuery)
							.then(() =>
								res.json({
									Server: `A customer by the id '${id}' is successfully deleted!`,
								})
							)
							.catch((err) => console.error(err))
					}
				})
			}
		})
	}
})

//* A GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, order references, order dates, product names, unit prices, suppliers and quantities.

app.get('/customers/:customerId/orders', async (req, res) => {
	const id = req.params.customerId
	const customerOrdersQuery = `
  SELECT order_reference, order_date, product_name, unit_price, supplier_name, quantity
  FROM customers
  INNER JOIN orders
  ON customers.id = orders.customer_id
  INNER JOIN order_items
  ON orders.id = order_items.order_id
  INNER JOIN product_availability
  ON order_items.product_id = product_availability.prod_id
  INNER JOIN products
  ON product_availability.prod_id = products.id
  INNER JOIN suppliers
  ON product_availability.supp_id = suppliers.id WHERE customers.id = ${id}`
	const checkIfExistsQuery =
		'SELECT EXISTS(SELECT 1 FROM customers WHERE id=$1)'

	if (!isValid(id)) {
		res.status(400).json({ 'Server message': 'Invalid id!' })
	} else {
		try {
			const result = await pool.query(checkIfExistsQuery, [id])
			const exists = result.rows.map((el) => el.exists)
			let doesExist = exists.pop()
			if (!doesExist) {
				res.status(404).json({
					'Server message': `A customer by the id ${id} does not exist!`,
				})
			} else {
				pool
					.query(customerOrdersQuery)
					.then((result) => res.json(result.rows))
					.catch((error) => console.error(error))
			}
		} catch (error) {
			res.status(500).send(error)
		}
	}
})

app.get('/suppliers', async (req, res) => {
	try {
		const result = await pool.query(suppliersQuery)
		res.json(result.rows)
	} catch (error) {
		res.status(500).send(error)
	}
})

app.listen(port, () => {
	console.log(
		`Server is listening on port ${port} and ready to accept requests!`
	)
})
