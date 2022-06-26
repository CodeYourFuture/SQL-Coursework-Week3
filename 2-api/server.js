const express = require('express')
const { Pool } = require('pg')
const app = express()

app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server is listening to port ${port}`))

app.get('/', (req, res) => {
  res.send(
    `
        <ul style="font-size:24px">
            <li>/products</li>
            <li>/products?name=Cup</li>
            <li>/customers</li>
            <li>/customers/:customerId</li>
            <li>/customers/:customerId/orders</li>
            <li>/availability</li>
            <li>/orders/:orderId</li>
        </ul>
        `,
  )
})

// Products
app.get('/products', (req, res) => {
  const name = req.query.name
  const where = name ? `Where product_name LIKE '%${name}%'` : ``
  const queryString = `   SELECT product_name, supplier_name, unit_price
        FROM products 
        INNER JOIN product_availability on prod_id = products.id
        INNER JOIN suppliers on suppliers.id = supp_id
    ${where}
    `
  pool
    .query(queryString)
    .then((result) => res.status(200).json(result.rows))
    .catch((error) => res.status(500).json(error))
})

app.post('/products', (req, res) => {
  const productName = req.body.product_name
  const queryCheck = `SELECT * FROM products WHERE product_name = $1`
  const queryString = `INSERT INTO products (product_name) VALUES ($1)`
  pool
    .query(queryCheck, [productName])
    .then((result) => {
      if (result.rows.length > 0)
        res.status(400).send(`Product with the same name already exists!`)
      else {
        pool
          .query(queryString, [productName])
          .then(() => res.status(200).send(`Product created!`))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})

app.post('/availability', (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body
  const queryCheck = `SELECT * FROM availability WHERE prod_id = $1 and supp_id = $2`
  const queryString = `INSERT INTO availability (prod_id, supp_id, unit_price) 
                        VALUES ($1, $2, $3)`
  if (unit_price <= 0) res.status(400).send('Price must be greater than zero!')
  pool
    .query(queryCheck, [prod_id, supp_id])
    .then((result) => {
      if (result.rows.length > 0)
        res
          .status(400)
          .send(
            `Availability with the same product id and supplier id already exists!`,
          )
      else {
        pool
          .query(queryString, [prod_id, supp_id, unit_price])
          .then(() => res.status(200).send(`Availability created!`))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})

//Customers
app.get('/customers/:customerId', (req, res) => {
  const id = req.params.customerId
  const queryString = `   SELECT * 
        FROM customers 
        WHERE id = $1 
    `
  pool
    .query(queryString, [id])
    .then((result) => res.status(200).json(result.rows))
    .catch((error) => res.status(500).json(error))
})

app.post('/customers', (req, res) => {
  const { name, address, city, country } = req.body
  const queryCheck = `SELECT * FROM customers WHERE name = $1`
  const queryString = `INSERT INTO customers (name, address, city, country) 
                        VALUES ($1, $2, $3, $4)`
  pool
    .query(queryCheck, [name])
    .then((result) => {
      if (result.rows.length > 0)
        res.status(400).send(`Customer with the same name already exists!`)
      else {
        pool
          .query(queryString, [name, address, city, country])
          .then(() => res.status(200).send(`Customer created!`))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})

app.put('/customers/:customerId', (req, res) => {
  const customerId = req.params.customerId

  const insideParams = []
  const params = [customerId]

  Object.keys(req.body).map((param, index) => {
    insideParams.push(`${param} = $${index + 2}`)
    params.push(req.body[param])
  })
  const selectQuery = `SELECT * FROM customers WHERE id = $1`
  const updateQuery = `Update customers set ${insideParams.join(',')} where id = $1`

  pool.query(selectQuery, [customerId]).then((result) => {
    if (result.rows == 0) res.status(400).send("Customer doesn't exist!")
    else {
      if (
        req.body.hasOwnProperty('email') &&
        (!req.body['email'].includes('@') || !req.body['email'].includes('.'))
      )
        res.status(400).send('The email address is not valid!')
      else
        pool
          .query(updateQuery, params)
          .then(() =>
            res.status(200).send(`Customer ${customerId} has been updated!`),
          )
          .catch((error) => {
            console.log(error)
            res.status(500).json(error)
          })
    }
  })
})

app.delete('/customers/:customerId', (req, res) => {
  const customerId = req.params.customerId
  const queryCheck = `SELECT * FROM customers WHERE id = $1`
  const queryString = `DELETE FROM customers WHERE id = $1`
  pool
    .query(queryCheck, [customerId])
    .then((result) => {
      if (result.rows.length == 0)
        res.status(400).send(`Customer with the id doesn't exists!`)
      else {
        pool
          .query(queryString, [customerId])
          .then(() => res.status(200).send(`Customer has been deleted!`))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})

//Orders

app.get('/customers/:customerId/orders', (req, res) => {
  const customerId = req.params.customerId
  const queryCheck = `SELECT * FROM customers WHERE id = $1`
  const queryString = `SELECT  order_reference, 
            order_date, 
            product_name, 
            unit_price, 
            supplier_name, 
            quantity
    FROM orders
    INNER JOIN order_items on order_id = orders.id
    INNER JOIN products on products.id = product_id
    INNER JOIN suppliers on suppliers.id = supplier_id
    INNER JOIN product_availability on supp_id = supplier_id and prod_id = product_id
    WHERE customer_id = $1
    `
  pool
    .query(queryCheck, [customerId])
    .then((result) => {
      if (result.rows.length == 0)
        res.status(400).send(`Customer with the id doesn't exists!`)
      else {
        pool
          .query(queryString, [customerId])
          .then((result) => res.status(200).json(result.rows))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})

app.post('/customers/:customerId/orders', (req, res) => {
  const { order_date, order_reference, customer_id } = req.body
  const queryCheck = `SELECT * FROM customers WHERE id = $1`
  const queryString = `INSERT INTO orders (order_date, order_reference, customer_id) 
                        VALUES ($1, $2, $3)`
  pool
    .query(queryCheck, [customer_id])
    .then((result) => {
      if (result.rows.length == 0)
        res.status(400).send(`Customer with the id doesn't exists!`)
      else {
        pool
          .query(queryString, [order_date, order_reference, customer_id])
          .then(() => res.status(200).send(`Order created!`))
          .catch((error) => res.status(500).json(error))
      }
    })
    .catch((error) => res.status(500).json(error))
})
