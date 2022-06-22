# Homework

## Submission

You can continue working on the code from last week for this weeks task.

To submit you should open a pull request with all of your code in this folder.

## Task

In the following homework, you will create new API endpoints in the NodeJS application `cyf-ecommerce-api` that you created for last week's homework for the Database 2 class.

- If you don't have it already, add a new GET endpoint `/products` to load all the product names along with their prices and supplier names.

- Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

- Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.

```sql
SELECT * FROM customers WHERE id = $1
```

- Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

```sql
INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)
```

- Add a new POST endpoint `/products` to create a new product.

```sql
INSERT INTO products (product_name) VALUES ($1)
```

- Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

```sql
INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)
```

- Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

```sql
INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)
```

- Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

```sql
DELETE FROM orders WHERE id=$1
```

- Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

```sql
DELETE FROM customers WHERE id=$1
```

- Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

```sql
SELECT customers.id AS customer_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity
FROM orders
INNER JOIN order_items
ON orders.id = order_items.order_id
INNER JOIN customers ON orders.customer_id = customers.id
INNER JOIN products ON order_items.product_id = products.id
INNER JOIN suppliers ON order_items.supplier_id = suppliers.id
INNER JOIN product_availability ON order_items.product_id = product_availability.prod_id
WHERE customers.id = 1;
```
