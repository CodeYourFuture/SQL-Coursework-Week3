-- 1. Retrieve all the customers' names and addresses who live in the United States

select name, address from customers where country = 'United States';

-- 2. Retrieve all the customers in ascending name sequence

select name from customers order by name ASC;

-- 3. Retrieve all the products whose name contains the word `socks`

select * from products where product_name LIKE '%socks%';

-- 4. Retrieve all the products which cost more than 100 showing product id, name, unit price and supplier id.

select product_availability.prod_id, products.product_name, product_availability.unit_price, product_availability.supp_id from product_availability
inner join products on products.id = product_availability.prod_id
where product_availability.unit_price > 100;

-- 5. Retrieve the 5 most expensive products

select products.product_name, product_availability.unit_price from products
inner join product_availability on products.id = product_availability.prod_id
order by product_availability.unit_price DESC limit 5;

-- 6. Retrieve all the products with their corresponding suppliers. The result should only contain the columns `product_name`, `unit_price` and `supplier_name`

select products.product_name, product_availability.unit_price, suppliers.supplier_name from products
inner join product_availability on products.id = product_availability.prod_id
inner join suppliers on product_availability.supp_id = suppliers.id;

-- 7. Retrieve all the products sold by suppliers based in the United Kingdom. The result should only contain the columns `product_name` and `supplier_name`.

select products.product_name, suppliers.supplier_name from products
inner join product_availability on products.id = product_availability.prod_id
inner join suppliers on product_availability.supp_id = suppliers.id
where suppliers.country = 'United Kingdom';

-- 8. Retrieve all orders, including order items, from customer ID `1`. Include order id, reference, date and total cost (calculated as quantity * unit price).

select distinct orders.id, products.product_name, orders.order_reference, orders.order_date, product_availability.unit_price * order_items.quantity as total_cost from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
where customers.id = 1;

-- 9. Retrieve all orders, including order items, from customer named `Hope Crosby`

select orders.id, products.product_name from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
where customers.name = 'Hope Crosby';

-- 10. Retrieve all the products in the order `ORD006`. The result should only contain the columns `product_name`, `unit_price` and `quantity`.

select  products.product_name, product_availability.unit_price, order_items.quantity from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
where orders.order_reference = 'ORD006';

-- 11. Retrieve all the products with their supplier for all orders of all customers. The result should only contain the columns `name` (from customer), `order_reference`, `order_date`, `product_name`, `supplier_name` and `quantity`.

select distinct customers.name, orders.order_reference, orders.order_date, products.product_name, suppliers.supplier_name, order_items.quantity from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
inner join suppliers on suppliers.id = product_availability.prod_id;

-- 12. Retrieve the names of all customers who bought a product from a supplier based in China.

select distinct customers.name from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
inner join suppliers on suppliers.id = product_availability.prod_id
where suppliers.country = 'China';

-- 13. List all orders giving customer name, order reference, order date and order total amount (quantity * unit price) in descending order of total.

select distinct customers.name, orders.order_reference, orders.order_date, order_items.quantity * product_availability.unit_price as order_total_amount from orders
inner join customers on customers.id = orders.customer_id
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
inner join suppliers on suppliers.id = product_availability.prod_id
order by order_total_amount DESC;


--return all the product names along with their prices and supplier names.
-- select products.product_name, product_availability.unit_price, suppliers.supplier_name from products
-- inner join product_availability on products.id = product_availability.prod_id
-- inner join suppliers on suppliers.id = product_availability.supp_id;


-- orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
select orders.id as order_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity from orders
inner join order_items on orders.id = order_items.order_id
inner join product_availability on order_items.product_id = product_availability.prod_id
inner join products on products.id = product_availability.prod_id
inner join suppliers on suppliers.id = product_availability.prod_id
where orders.customer_id = 1;