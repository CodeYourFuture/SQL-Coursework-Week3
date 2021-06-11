function isPositiveInteger(v) {
  let i;
  return v && (i = parseInt(v)) && i > 0 && (i === v || "" + i === v);
}

if (isPositiveInteger(-12) === true) {
console.log("yes")};