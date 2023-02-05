const sendData = async () => {
  try {
    const res = await fetch("http://localhost:3000/customers/4", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Omid",
        address: "Warwick Rd",
        city: "Solihull",
        country: "United Kingdom",
      }),
    });
    const out = await res.json();
    console.log(out);
  } catch (e) {
    console.log(e);
  }
};
sendData();
