const sendData = async () => {
  try {
    const res = await fetch("http://localhost:3000/availability", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        prodID: 8,
        supID: 1,
        price: 32,
      }),
    });
    const out = await res.json();
    console.log(out);
  } catch (e) {
    console.log(e);
  }
};
sendData();
