function isValidId(id) {
  if (
    /^[0-9]+$/.test(id) === false ||
    parseInt(id) === NaN ||
    parseInt(id) <= 0
  ) {
    return false;
  } else {
    return true;
  }
}

// this really needs to include "space" to be a catchall for everything but that probably allows injection
function isInjectionFree(queryParameter) {
  const regex = /^[a-zA-Z0-9_\-.,]+$/g;
  return regex.test(queryParameter);
}

function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}

function isValidOrderReference(orderReference) {
  const regex = /^ORD\d{3}$/;
  return regex.test(orderReference);
}

module.exports = {
  isValidId,
  isInjectionFree,
  isValidDate,
  isValidOrderReference,
};
