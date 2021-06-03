const pool = require("../config");
// DATA VALIDATION
function allowOrForbidCustomerUpdate(cInfo, c) {
  const { id } = cInfo;
  const errors = [];
  if (id && id !== c.id) {
    errors.push({
      Error: "Update faild. Changing customer ID is not allowed!",
    });
  }
  return errors;
}

// COMPARE INCOMING AND ORIGINAL CUSTOMER INFORMATION
function compareWithOriginal(originalCustomerInfo, updatedCustomerInfo) {
  const c = originalCustomerInfo[0];
  const result = {};
  const { name, address, city, country } = updatedCustomerInfo;
  if (name && name !== c.name) {
    result["name"] = name;
  }
  if (address && address !== c.address) {
    result["address"] = address;
  }
  if (city && city !== c.city) {
    result["city"] = city;
  }
  if (country && country !== c.country) {
    result["country"] = country;
  }
  return result;
}

// CONSTRUCT CUSTOMER UPDATE SQL STATEMENT, DYNAMICALLY
function buildUpdateQuery(fields) {
  const keys = Object.keys(fields);
  const columnUpdate = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");
  const query = `UPDATE customers SET ${columnUpdate} WHERE id = $${
    keys.length + 1
  }`;
  return query;
}

function getCustomerOrdersQuery() {
  return `SELECT 
          o.order_reference AS "Order Reference",
          o.order_date AS "Order Date",
          p.product_name AS "Product Name",
          pa.unit_price AS "Unit Price",
          s.supplier_name AS "Supplier Name",
          oi.quantity AS "Quantity Ordered"
          FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id 
              INNER JOIN customers c ON c.id = o.customer_id
                INNER JOIN products p ON p.id = oi.product_id
                  INNER JOIN product_availability pa ON pa.prod_id = oi.product_id
                    INNER JOIN suppliers s ON s.id = oi.supplier_id
                      WHERE c.id = $1;`;
}

module.exports = {
  buildUpdateQuery,
  allowOrForbidCustomerUpdate,
  compareWithOriginal,
  getCustomerOrdersQuery,
};
