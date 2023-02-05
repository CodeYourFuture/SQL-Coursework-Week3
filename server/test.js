const sendData = async () => {
  try {
    const res = await fetch("http://localhost:3000/products", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        id: 8,
        name: "Amazon Fire TV",
      }),
    });
    await res.json();
  } catch (e) {
    console.log(e);
  }
};
sendData();
