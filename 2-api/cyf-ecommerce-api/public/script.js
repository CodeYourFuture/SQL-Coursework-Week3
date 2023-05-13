async function fetchFormatAndOutput(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const data = await response.json();
    console.log("fetch data:", data);
    const responseContainer = document.getElementById("response-container");
    responseContainer.innerText = "";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.id = "output-json";
    code.innerText = JSON.stringify(data, null, 2);
    pre.appendChild(code);
    responseContainer.appendChild(pre);
  } catch (error) {
    console.log(error);
  }
}

const paths = ["/customers", "/suppliers", "/products"];

paths.forEach((path) => {
  const navButtons = document.getElementById("get-buttons");
  const button = document.createElement("button");
  button.id = path;
  button.innerText = path;
  button.addEventListener("click", (event) =>
    fetchFormatAndOutput(event.target.id)
  );
  navButtons.appendChild(button);
});

const getCustomerByIdForm = document.getElementById("form-get-customer-byid");
getCustomerByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const getCustomerByIdSubmit = document.getElementById(
      "form-get-customer-byid-submit"
    );
    getCustomerByIdSubmit.disabled = true;

    const customerId = document.getElementById(
      "form-get-customer-byid-id"
    ).value;

    await fetchFormatAndOutput(`/customers/${customerId}`);

    getCustomerByIdSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const getProductByNameForm = document.getElementById("form-get-product-byname");
getProductByNameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const getProductByNameSubmit = document.getElementById(
      "form-get-product-byname-submit"
    );
    getProductByNameSubmit.disabled = true;

    const productName = document.getElementById(
      "form-get-product-byname-productname"
    ).value;

    await fetchFormatAndOutput(`/products?name=${productName}`);

    getProductByNameSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const postCustomerForm = document.getElementById("form-post-customer");
postCustomerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const postCustomerSubmit = document.getElementById(
      "form-post-customer-submit"
    );
    postCustomerSubmit.disabled = true;

    const name = document.getElementById("form-post-customer-name").value;
    const address = document.getElementById("form-post-customer-address").value;
    const city = document.getElementById("form-post-customer-city").value;
    const country = document.getElementById("form-post-customer-country").value;

    await fetchFormatAndOutput(`/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        address: address,
        city: city,
        country: country,
      }),
    });

    postCustomerSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const postProductForm = document.getElementById("form-post-product");
postProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const postProductSubmit = document.getElementById(
      "form-post-product-submit"
    );
    postProductSubmit.disabled = true;

    const productName = document.getElementById(
      "form-post-product-productname"
    ).value;

    await fetchFormatAndOutput(`products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productname: productName,
      }),
    });

    postProductSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const postAvailabilityForm = document.getElementById("form-post-availability");
postAvailabilityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const postAvailabilitySubmit = document.getElementById(
      "form-post-availability-submit"
    );
    postAvailabilitySubmit.disabled = true;

    const productId = document.getElementById(
      "form-post-availability-productid"
    ).value;
    const supplierId = document.getElementById(
      "form-post-availability-supplierid"
    ).value;
    const unitPrice = document.getElementById(
      "form-post-availability-unitprice"
    ).value;

    await fetchFormatAndOutput(`/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productid: productId,
        supplierid: supplierId,
        unitprice: unitPrice,
      }),
    });

    postAvailabilitySubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const postCustomerOrderForm = document.getElementById(
  "form-post-customer-order"
);
postCustomerOrderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const postCustomerOrderSubmit = document.getElementById(
      "form-post-customer-order-submit"
    );
    postCustomerOrderSubmit.disabled = true;

    const customerId = document.getElementById(
      "form-post-customer-order-customerid"
    ).value;
    const orderDate = document.getElementById(
      "form-post-customer-order-orderdate"
    ).value;
    const orderReference = document.getElementById(
      "form-post-customer-order-orderreference"
    ).value;

    await fetchFormatAndOutput(`/customers/${customerId}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderdate: orderDate,
        orderreference: orderReference,
      }),
    });

    postCustomerOrderSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const putCustomerByIdForm = document.getElementById("form-put-customer");
putCustomerByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const putCustomerByIdSubmit = document.getElementById(
      "form-put-customer-submit"
    );
    putCustomerByIdSubmit.disabled = true;

    const customerId = document.getElementById(
      "form-put-customer-customerid"
    ).value;
    const name = document.getElementById("form-put-customer-name").value;
    const address = document.getElementById("form-put-customer-address").value;
    const city = document.getElementById("form-put-customer-city").value;
    const country = document.getElementById("form-put-customer-country").value;

    await fetchFormatAndOutput(`/customers/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        address: address,
        city: city,
        country: country,
      }),
    });

    putCustomerByIdSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const deleteOrderByIdForm = document.getElementById("form-delete-order");
deleteOrderByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const deleteOrderByIdSubmit = document.getElementById(
      "form-delete-order-submit"
    );
    deleteOrderByIdSubmit.disabled = true;

    const orderId = document.getElementById("form-delete-order-orderid").value;

    await fetchFormatAndOutput(`/orders/${orderId}`, {
      method: "DELETE",
    });

    deleteOrderByIdSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const deleteCustomerByIdForm = document.getElementById("form-delete-customer");
deleteCustomerByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const deleteCustomerByIdSubmit = document.getElementById(
      "form-delete-customer-submit"
    );
    deleteCustomerByIdSubmit.disabled = true;

    const customerId = document.getElementById(
      "form-delete-customer-customerid"
    ).value;

    await fetchFormatAndOutput(`/customers/${customerId}`, {
      method: "DELETE",
    });

    deleteCustomerByIdSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});
