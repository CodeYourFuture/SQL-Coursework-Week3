const sendData = async () => {
  try {
    const res = await fetch("http://localhost:3000/customers", {
      method: "POST",
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
    console.log(out.data);
  } catch (e) {
    console.log(e);
  }
};
sendData();
