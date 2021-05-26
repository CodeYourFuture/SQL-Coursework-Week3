// SELECT * FROM products
const getAllProductsQuery = `SELECT
                            p.id AS "Product ID",
                            p.product_name AS "Product Name",
                            pa.unit_price AS "Unit Price",
                            s.supplier_name AS "Supplier Name"
                            FROM products p
                              INNER JOIN product_availability pa ON pa.prod_id = p.id 
                                INNER JOIN suppliers s ON pa.supp_id = s.id`;

function getProductByNameQuery(pName) {
  let searchQuery = getAllProductsQuery;
  return pName
    ? [searchQuery + ` WHERE product_name ILIKE $1;`, [`%${pName}%`]]
    : [searchQuery+";", ""];
}

module.exports = {
  getProductByNameQuery,
};
