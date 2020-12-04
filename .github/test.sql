SELECT order_reference, order_date, product_name, unit_price,supplier_name, quantity 
FROM customers 
INNER JOIN orders ON orders.customer_id = customers.id 
INNER JOIN order_items ON order_items.order_id=orders.id
INNER JOIN products ON order_items.product_id =products.id 
INNER JOIN suppliers ON products.supplier_id = suppliers.id 
WHERE customer_id =1;

SELECT order_reference, order_date, product_name, unit_price,supplier_name, quantity 
FROM  orders
INNER JOIN order_items ON order_items.order_id=orders.id
INNER JOIN products ON order_items.product_id =products.id 
INNER JOIN suppliers ON products.supplier_id = suppliers.id 
WHERE customer_id =1;