export function toString(data) {
  let result = "";
  for (let i = 0, len = data.length; i < len; i++) {
    const value = data[i];
    result +=
      (i === 0 ? "" : " ") +
      (typeof value === "object"
        ? JSON.stringify(value, circularReplacer(), 4)
        : typeof value === "bigint"
          ? `${value}n`
          : String(value));
  }
  return result;
}

function circularReplacer() {
  const ancestors = [];
  const converted = new WeakMap();
  return function (_, value) {
    if (typeof value === "bigint") return `${value}n`;
    if (typeof value === "object" && value !== null) {
      if (value instanceof Error || value instanceof Map || value instanceof Set) {
        if (!converted.has(value)) {
          if (value instanceof Error) {
            const error = { ...value, name: value.name, message: value.message, stack: value.stack };
            if ("cause" in value) error["cause"] = value.cause;
            converted.set(value, error);
          } else if (value instanceof Map) converted.set(value, { type: "Map", entries: [...value] });
          else converted.set(value, { type: "Set", values: [...value] });
        }
        value = converted.get(value);
      }
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) ancestors.pop();
      if (ancestors.includes(value)) return "[Circular]";
      ancestors.push(value);
    }
    return value;
  };
}

/** @param {string[]} [properties] */
export function table(data, properties) {
  if (properties !== undefined && (!Array.isArray(properties) || properties.some((key) => typeof key !== "string")))
    throw new TypeError("Console table properties must be an array of strings");
  if (data === null || typeof data !== "object") return toString([data]);
  const entries = Object.entries(data);
  const isRecord = (value) => value !== null && typeof value === "object";
  const columns = properties || [...new Set(entries.flatMap(([, value]) => (isRecord(value) ? Object.keys(value) : [])))];
  const hasValues = entries.some(([, value]) => !isRecord(value));
  const cell = (value) => toString([value]).replace(/\r?\n/g, "\\n");
  const rows = [
    ["(index)", ...columns, ...(hasValues ? ["Values"] : [])],
    ...entries.map(([key, value]) => [
      key,
      ...columns.map((column) => (isRecord(value) && Object.hasOwn(value, column) ? cell(value[column]) : "")),
      ...(hasValues ? [isRecord(value) ? "" : cell(value)] : []),
    ]),
  ];
  const widths = rows[0].map((_, index) => rows.reduce((width, row) => Math.max(width, row[index].length), 0));
  const border = "+" + widths.map((width) => "-".repeat(width + 2)).join("+") + "+";
  const render = (row) => "| " + row.map((value, index) => value.padEnd(widths[index])).join(" | ") + " |";
  return [border, render(rows[0]), border, ...rows.slice(1).map(render), border].join("\n");
}
