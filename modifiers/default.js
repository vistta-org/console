export function toString(data) {
  let result = "";
  for (let i = 0, len = data.length; i < len; i++) {
    const value = data[i];
    result += (i === 0 ? "" : " ") + (typeof value === "object" ? JSON.stringify(value, duplicateReplacer(), 4) : value);
  }
  return result;
}

function duplicateReplacer(set = new WeakSet()) {
  return function (_, value) {
    if (typeof value === "object" && value !== null) {
      if (set.has(value)) return;
      set.add(value);
    }
    return value;
  };
}
