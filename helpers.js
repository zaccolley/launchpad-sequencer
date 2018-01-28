function getKeyByValue (object, value) {
  return Object.keys(object).find(key => object[key] === value.toString())
}

function cloneArray (arr) {
  return arr.slice(0)
}

export {
  getKeyByValue,
  cloneArray
}
