import { date } from "@vistta/date-time";
const write = console.log.bind(console);
const clear = console.clear.bind(console);
const logs = [];
const ids = [];

class Console {
  static reset = typeof process === "undefined" ? "" : "\x1b[0m";
  static bright = typeof process === "undefined" ? "" : "\x1b[1m";
  static dim = typeof process === "undefined" ? "" : "\x1b[2m";
  static underscore = typeof process === "undefined" ? "" : "\x1b[4m";
  static blink = typeof process === "undefined" ? "" : "\x1b[5m";
  static reverse = typeof process === "undefined" ? "" : "\x1b[7m";
  static black = typeof process === "undefined" ? "" : "\x1b[30m";
  static red = typeof process === "undefined" ? "" : "\x1b[31m";
  static green = typeof process === "undefined" ? "" : "\x1b[32m";
  static yellow = typeof process === "undefined" ? "" : "\x1b[33m";
  static blue = typeof process === "undefined" ? "" : "\x1b[34m";
  static magenta = typeof process === "undefined" ? "" : "\x1b[35m";
  static cyan = typeof process === "undefined" ? "" : "\x1b[36m";
  static white = typeof process === "undefined" ? "" : "\x1b[37m";
  #id = "";
  #timers = {};
  #counts = {};
  #groups = 0;
  #index;
  #date;
  #debug;
  #trace;

  Console = Console;
  constructor(id, { date, trace, debug, index = 0 } = {}) {
    if (typeof id !== "string") throw new Error("Error console needs an id");
    if (ids.indexOf(id) != -1)
      throw new Error("Error console id needs to be unique.");
    ids.push(((this.#id = id), id));
    this.#date = date !== false;
    this.#debug = process.stdout.isTTY
      ? debug == null
        ? process.env.NODE_DEBUG
        : debug
      : true;
    this.#trace = trace == null ? process.env.NODE_TRACE : trace;
    this.#index = index;
    clear();
  }

  announce(...data) {
    this.#apply({ type: "announce", data, color: Console.bright });
  }

  assert(condition, ...data) {
    if (condition)
      data.unshift(`${Console.green}Assertion passed${Console.reset}`);
    else data.unshift(`${Console.red}Assertion failed${Console.reset}`);
    this.#apply({ type: "assert", data });
  }

  clear() {
    if (this.#debug) return;
    clear();
    let i = 0;
    while (logs[i]) {
      if (logs[i].id === this.#id) logs.splice(i, 1);
      else {
        write(logs[i].message);
        i++;
      }
    }
  }

  count(key = "") {
    if (!this.#counts[key]) this.#counts[key] = 0;
    this.#apply({
      type: "count",
      data: [`${key}: ${this.#counts[key]++}`],
      date: date().toString(),
    });
  }

  countReset(key = "") {
    this.#counts[key] = 0;
  }

  print(...data) {
    this.#apply({ type: "debug", data });
  }

  println() {
    this.#apply({ type: "debug", data: [""] });
  }

  debug(...data) {
    this.#apply({ type: "debug", data, date: date().toString() });
  }

  dir(item) {
    this.#apply({ type: "dir", data: [item] });
  }

  dirxml(...data) {
    this.#apply({ type: "dirxml", data });
  }

  error(...data) {
    this.#apply({
      type: "error",
      data,
      color: Console.red,
      date: date().toString(),
    });
  }

  group(...data) {
    if (data.length) this.#apply({ type: "log", data });
    this.#groups++;
  }

  groupCollapsed() {}

  groupEnd() {
    if (this.#groups > 0) this.#groups--;
  }

  info(...data) {
    this.#apply({
      type: "info",
      data,
      color: Console.cyan,
      date: date().toString(),
    });
  }

  log(...data) {
    this.#apply({ type: "log", data, date: date().toString() });
  }

  success(...data) {
    this.#apply({
      type: "success",
      data,
      color: Console.green,
      date: date().toString(),
    });
  }

  table(data, properties) {
    if (!Array.isArray(data) || data.length === 0) return;
    const isObject = typeof data[0] === "object";
    const headers = [
      "(index)",
      ...(isObject ? Object.keys(data[0]) : ["Values"]),
    ];
    properties = properties || headers.join("\t");
    this.#apply({
      type: "log",
      data: [
        properties +
          "\n" +
          data
            .map((obj, index) =>
              !isObject
                ? index + "\t" + obj
                : headers
                    .map((key) => (key === "(index)" ? index : obj[key]))
                    .join("\t"),
            )
            .join("\n"),
      ],
    });
  }

  time(key, force = false) {
    if (!force && this.#timers[key])
      return console.warn(`${key} already exists.`);
    this.#timers[key] = date();
  }

  timeEnd(key, print = true) {
    if (!this.#timers[key]) return;
    if (print) this.timeStamp(key);
    delete this.#timers[key];
  }

  timeLog(key, ...data) {
    if (!this.#timers[key]) return;
    data.push(
      `${Console.reset + Console.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
    );
    this.#apply({ type: "timeLog", data, date: date().toString() });
  }

  timeStamp(key) {
    if (!this.#timers[key]) return;
    this.#apply({
      type: "warn",
      data: [
        `${key} ${Console.reset + Console.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
      ],
      date: date().toString(true),
    });
  }

  trace(...data) {
    this.#apply({ type: "trace", data, date: date().toString(), trace: true });
  }

  warn(...data) {
    this.#apply({
      type: "warn",
      data,
      color: Console.yellow,
      date: date().toString(),
    });
  }

  profile(key, force = false) {
    if (!force && this.#timers[key])
      return console.warn(`${key} already exists.`);
    this.#timers[key] = date();
  }

  profileEnd(key, print = true) {
    if (!this.#timers[key]) return;
    if (print) this.timeStamp(key);
    delete this.#timers[key];
  }

  //

  #apply({ type, data, color, date, trace }) {
    if (!(data?.length > 0)) return;
    const log = { id: this.#id, type, date, message: "" };
    let initial = color || "";
    if (this.#date && date)
      initial = `${Console.dim}[${date}]${color || Console.reset} `;
    log.message += "\t".repeat(this.#groups);
    log.message += data.reduce((message, value, index) => {
      const spacer = index === 0 ? "" : " ";
      if (typeof value === "object")
        return (
          message +
          spacer +
          JSON.stringify(
            value,
            ((seen) => (_, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return;
                seen.add(value);
              }
              return value;
            })(new WeakSet()),
            4,
          )
        );
      return message + spacer + `${value}`;
    }, initial);
    if (trace || this.#trace)
      log.message += "\n" + new Error().stack.split("\n").slice(2).join("\n");
    log.message += Console.reset;
    if (this.#debug) {
      write(log.message);
      logs.push(log);
      return;
    }
    log.index = this.#index;
    let acc = "";
    let placement;
    for (let i = 0, len = logs.length; i < len; i++) {
      if (placement == null) {
        if (log.index < logs[i].index) {
          placement = i;
          clear();
          write(acc + log.message);
        } else acc += logs[i].message + "\n";
      } else write(logs[i].message);
    }
    if (placement == null) (placement = logs.length), write(log.message);
    logs.splice(placement, 0, log);
  }
}

export default Console;
export { Console };
