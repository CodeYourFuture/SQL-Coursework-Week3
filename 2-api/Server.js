const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
const pool = new Pool({
	user: "ryanscpt",
	host: "localhost",
	database: "cyf_ecommerce",
	password: "",
	port: 5432,
});

app.get("/", (req, res) => {
	console.log("Welcome over here!");
	res.send("Welcome to the postgresql server!");
});

app
	.route("/customers")
	.get(async (req, res) => {
		const result = await pool.query(`SELECT * FROM customers`);
		res.json(result.rows);
	})
	.post((req, res) => {
		const { name, address, city, country } = req.body;
		console.log(name, address, city, country);
		if (name && address && city && country) {
			console.log("Passed the test");
			pool
				.query("SELECT * FROM customers WHERE name=$1 AND address=$2", [
					name,
					address,
				])
				.then((result) => {
					if (result.rows.length > 0) {
						res
							.status(400)
							.send("A customer with same name and address already exists");
					} else {
						console.log("In Else");
						pool
							.query(
								"INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)",
								[name, address, city, country]
							)
							.then(() => {
								res.send({
									Error: false,
									Msg: "successful",
								});
							})
							.catch((err) => console.log(err));
					}
				});
		} else {
			res.status(400).send({
				Error: true,
				Msg: "Unsuccessful",
			});
		}
	});

app
	.route("/customers/:customerId")
	.get((req, res) => {
		const { customerId } = req.params;
		pool
			.query(`SELECT * FROM customers WHERE customers.id = $1`, [customerId])
			.then((result) => res.json(result.rows))
			.catch((e) => console.log(e));
	})
	.put((req, res) => {
		console.log("In Put");
		const { customerId } = req.params;
		const { name, address, city, country } = req.body;
		if (name || address || city || country) {
			pool
				.query(`SELECT * FROM customers WHERE id=$1`, [customerId])
				.then((result) => {
					if (result.rows.length < 1) {
						res
							.status(400)
							.send({ Error: true, Msg: `No customer with id: ${customerId}` });
					} else {
						pool
							.query(
								"UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
								[
									// name ? name : "customers.name" ? to check if a value is present and access the current value instead
									name,
									address,
									city,
									country,
									customerId,
								]
							)
							.then(() => {
								res.send({ Error: false, Msg: "Success! Customer updated" });
							})
							.catch((err) => console.error(err));
					}
				});
		} else {
			res.status(400).send({ Error: true, Msg: "No data found" });
		}
	})
	.delete((req, res) => {
		console.log("In Delete");
		const { customer_id } = req.params.customerId;
		pool
			.query("DELETE FROM orders WHERE customer_id=$1", [customer_id])
			.then(() => {
				pool
					.query("DELETE FROM customers WHERE id=$1", [customer_id])
					.then(() =>
						res.send({
							Error: false,
							Msg: "Success! Customer and orders deleted",
						})
					)
					.catch((err) => console.error(err));
			});
	});

app.get("/suppliers", (req, res) => {
	pool.query(`SELECT supplier_name FROM suppliers`, (err, result) => {
		console.log(result.rows);
		res.json(result.rows);
	});
});

app
	.route("/products")
	.get((req, res) => {
		const product = req.query.product;
		console.log(product);
		if (product) {
			console.log("if");
			pool
				.query(
					`SELECT product_name, supplier_name, unit_price 
			FROM order_items 
			INNER JOIN product_availability 
			on product_id = prod_id 
			INNER JOIN products
			on prod_id = products.id
			INNER JOIN suppliers 
			on supp_id = suppliers.id
			WHERE LOWER(product_name) LIKE '%${product.toLowerCase()}%';`
				)
				.then((result) => res.json(result.rows))
				.catch((e) => console.log(e));
		} else {
			pool.query(
				`SELECT product_name, supplier_name, unit_price 
			FROM order_items 
			INNER JOIN product_availability 
			on product_id = prod_id 
			INNER JOIN products
			on prod_id = products.id
			inner join suppliers 
			on supp_id = suppliers.id; `,
				(err, result) => {
					console.log("Else");
					res.json(result.rows);
				}
			);
		}
	})
	.post((req, res) => {
		const { product_name } = req.body;
		if (product_name) {
			// pool **We can have multiple products with the same name**
			// 	.query("SELECT * FROM products WHERE product_name=$1", [product_name])
			// 	.then((result) => {
			// 		if (result.rows.length > 0) {
			// 			res.status(400).send({
			// 				Error: true,
			// 				message: "A Product with that name already exists",
			// 			});
			// 		} else {
			pool
				.query("INSERT INTO products (product_name) VALUES ($1)", [
					product_name,
				])
				.then(() =>
					res.send({
						Error: false,
						message: "Product Created!",
					})
				)
				.catch((err) => console.error(err));
			// 	}
			// });
		} else {
			res.status(400).send({
				Error: true,
				Msg: "No product found",
			});
		}
	});

app.post("/availability", (req, res) => {
	const { prod_id, supp_id, unit_price } = req.body;
	if (prod_id && supp_id && unit_price && unit_price > 0) {
		pool.query(`SELECT * FROM products WHERE id=${prod_id}`).then((result) => {
			if (result.rows.length > 0) {
				pool
					.query(`SELECT * FROM suppliers WHERE id=$1`, [supp_id])
					.then((result) => {
						if (result.rows.length > 0) {
							pool
								.query(
									"INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
									[prod_id, supp_id, unit_price]
								)
								.then(() => {
									res.send({
										Error: true,
										Msg: "Success product added",
									});
								})
								.catch((err) => console.log(err));
						} else {
							res
								.status(400)
								.send({ Error: true, Msg: "Supplier does not exist" });
						}
					});
			} else {
				res.status(400).send({ Error: true, Msg: "Product does not exist" });
			}
		});
	} else {
		res.status(400).send({
			Error: true,
			Msg: "Missing data or Unit price must be positive",
		});
	}
});

app.post("/customers/:customerId/orders", (req, res) => {
	const { order_date, order_reference } = req.body;
	const customer_id = req.params.customerId;
	if (order_date && order_reference && customer_id) {
		pool
			.query(`SELECT * FROM customers WHERE id=$1`, [customer_id])
			.then((result) => {
				if (result.rows.length > 0) {
					pool
						.query(
							"INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
							[order_date, order_reference, customer_id]
						)
						.then(() => {
							res.send({ Error: false, Msg: "Success! Order added." });
						})
						.catch((err) => console.error(err));
				} else {
					res.status(400).send({
						Error: true,
						Msg: `Customer with id: ${customer_id} does not exist`,
					});
				}
			});
	} else {
		res.status(400).send({ Error: true, Msg: "Missing data" });
	}
});

app.delete("/orders/:orderId", (req, res) => {
	const { orderId } = req.params;
	pool
		.query("DELETE FROM order_items WHERE order_id=$1", [orderId])
		.then(() => {
			console.log("In first pool");
			pool
				.query("DELETE FROM orders WHERE id=$1", [orderId])
				.then(() => {
					console.log("In second swim");
					//Should we somehow be updating the quantity value?
					res.send({ Error: false, Msg: "Successful! Order deleted" });
				}) //Is it ok that the route works even if the id passed does not exits?
				.catch((err) => console.error(err));
		})
		.catch((err) => console.error(err));
});

app.get("/customers/:customerId/orders", (req, res) => {
	const { customerId } = req.params;
	pool
		.query(
			`SELECT order_reference, order_date, product_name, unit_price, supplier_name, quantity FROM order_items
		 INNER JOIN orders ON order_id=orders.id
		 INNER JOIN customers ON customer_id=customers.id
		 INNER JOIN product_availability ON prod_id=product_id
		 INNER JOIN suppliers ON supp_id=suppliers.id
		 INNER JOIN products ON prod_id=products.id
		 WHERE customers.id=$1  
		 `,
			[customerId]
		)
		.then((result) => {
			res.json(result.rows);
		})
		.catch((err) => console.error(err));
});

const listener = app.listen(3000 || process.env.PORT, () => {
	console.log(`Server listening on ${listener.address().port}`);
});
