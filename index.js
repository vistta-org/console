// @ts-check
import { date } from "@vistta/date-time";
import { execSync } from "node:child_process";

const IS_TTY = typeof process === "undefined" || process.stdout.isTTY;
const CONSOLE_FALLBACK = console;
const logs = [];
const write = ({ message, type }) => {
  if (type === "error") CONSOLE_FALLBACK.error(message);
  else CONSOLE_FALLBACK.log(message);
};
const clear = typeof process === "undefined" || process.platform !== 'win32' ? console.clear.bind(console) : () => execSync("powershell.exe Clear-Host");

/**
 * Object containing ANSI escape codes for text formatting.
 */
const COLORS = typeof process !== "undefined" && {
  /**
   * @returns {string} Code to reset the console color.
   */
  reset: "\x1b[0m",

  /**
   * @returns {string} Code to make the text bright.
   */
  bright: "\x1b[1m",

  /**
   * @returns {string} Code to make the text dim.
   */
  dim: "\x1b[2m",

  /**
   * @returns {string} Code to underline the text.
   */
  underscore: "\x1b[4m",

  /**
   * @returns {string} Code to blink the text.
   */
  blink: "\x1b[5m",

  /**
   * @returns {string} Code to reverse the text color.
   */
  reverse: "\x1b[7m",

  /**
   * @returns {string} Code to set the text color to black.
   */
  black: "\x1b[30m",

  /**
   * @returns {string} Code to set the text color to red.
   */
  red: "\x1b[31m",

  /**
   * @returns {string} Code to set the text color to green.
   */
  green: "\x1b[32m",

  /**
   * @returns {string} Code to set the text color to yellow.
   */
  yellow: "\x1b[33m",

  /**
   * @returns {string} Code to set the text color to blue.
   */
  blue: "\x1b[34m",

  /**
   * @returns {string} Code to set the text color to magenta.
   */
  magenta: "\x1b[35m",

  /**
   * @returns {string} Code to set the text color to cyan.
   */
  cyan: "\x1b[36m",

  /**
   * @returns {string} Code to set the text color to white.
   */
  white: "\x1b[37m"
};

/**
 * A class for creating and managing console logs.
 *
 * @class Console
 */
class Console {
  #logs = [];
  #timers = {};
  #counts = {};
  #groups = 0;
  #writer;
  #clear;
  #index;
  #date;
  #colors;
  #debug;
  #trace;

  /**
   * @returns {typeof Console} Console Instance Class.
   */
  get Console() {
    return Console;
  }

  /**
   * @returns {string[]} Console instance logs
   */
  get logs() {
    return this.#logs;
  }

  /**
   * Creates a new Console instance.
   * 
   * @typedef {Object} Options
   * @property {WritableStreamDefaultWriter} [writer] - Writable Stream.
   * @property {Function} [clear] - Function to clear the Stream if available.
   * @property {boolean} [date] - Whether to include the date in logs. Defaults to true.
   * @property {boolean | COLORS} [colors] - Whether to include colors in logs or object of the colors. Defaults to true if no writer is passed.
   * @property {boolean} [trace] - Whether to include the stack trace in logs. Defaults to the value of the `NODE_TRACE` environment variable.
   * @property {boolean} [debug] - Whether to enable debug mode. Defaults to the value of the `NODE_DEBUG` environment variable.
   * @property {number} [index] - The index of the console. Defaults to 0.
   * 
   * @param {Options} [options] - Optional configuration options or true for system default.
   */
  constructor({ writer, clear, date, colors, trace, debug, index } = {}) {
    // eslint-disable-next-line no-undef
    if (writer && !(writer instanceof WritableStreamDefaultWriter)) throw new TypeError("Console expects a WritableStreamDefaultWriter instance for writer");
    if (clear) {
      if (typeof clear !== "function") throw new TypeError("Console expects a Function instance for clear");
      if (!writer) throw new TypeError("Console clear can only be set if writer is set");
    }
    if (index != null) {
      if (typeof index !== "number") throw new TypeError("Console expects a number for index");
      if (writer) throw new TypeError("Console index cannot be set if writer is set");
    }
    this.#writer = writer;
    this.#clear = clear;
    const prototype = Object.getPrototypeOf(this);
    const functions = Object.getOwnPropertyNames(prototype);
    for (let i = 0, len = functions.length; i < len; i++) {
      if (functions[i] === "constructor") continue;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, functions[i]);
      if (typeof descriptor.get === 'undefined' && typeof descriptor.set === 'undefined')
        this[functions[i]] = this[functions[i]].bind(this);
    }
    this.#date = date !== false;
    this.#debug = debug == null ? process.env.NODE_DEBUG : debug;
    this.#trace = trace == null ? process.env.NODE_TRACE : trace;
    if (colors === true) this.#colors = COLORS;
    else if (colors === false) this.#colors = {}
    else this.#colors = colors || (writer ? {} : COLORS);
    this.#index = index == null ? 0 : index;
    this.clear();
  }

  /**
   * Announces a message.
   *
   * @param {...any} data - The message to announce.
   */
  announce(...data) {
    this.#apply({ type: "announce", data, color: this.#colors?.bright });
  }

  /**
   * Asserts a condition.
   *
   * @param {boolean} condition - The condition to assert.
   * @param {...any} data - The message to log if the condition fails.
   */
  assert(condition, ...data) {
    if (condition)
      data.unshift(`${this.#colors?.green}Assertion passed${this.#colors?.reset}`);
    else data.unshift(`${this.#colors?.red}Assertion failed${this.#colors?.reset}`);
    this.#apply({ type: "assert", data });
  }

  /**
   * Clears the console.
   */
  clear() {
    if (this.#clear) return (this.#logs = [], this.#clear());
    if (this.#debug || !IS_TTY) return;
    clear();
    let i = 0;
    this.#logs = [];
    while (logs[i]) {
      if (logs[i].instance === this) logs.splice(i, 1);
      else {
        write(logs[i].log);
        i++;
      }
    }
  }

  /**
   * Increments a counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  count(key = "") {
    if (!this.#counts[key]) this.#counts[key] = 0;
    this.#apply({
      type: "count",
      data: [`${key}: ${this.#counts[key]++}`],
      date: date().toString(),
    });
  }

  /**
   * Resets the counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  countReset(key = "") {
    this.#counts[key] = 0;
  }

  /**
   * Logs a message.
   *
   * @param {...any} data - The message to log.
   */
  print(...data) {
    this.#apply({ type: "debug", data });
  }

  /**
   * Logs a new line.
   */
  println() {
    this.#apply({ type: "debug", data: [""] });
  }

  /**
   * Logs a debug message.
   *
   * @param {...any} data - The message to log.
   */
  debug(...data) {
    this.#apply({ type: "debug", data, date: date().toString() });
  }

  /**
   * Logs an object.
   *
   * @param {Object} object - The object to log.
   */
  dir(object) {
    this.#apply({ type: "dir", data: [object] });
  }

  /**
   * Logs an XML object.
   *
   * @param {Object} object - The XML object to log.
   */
  dirxml(object) {
    this.#apply({ type: "dirxml", data: [object] });
  }

  /**
   * Logs an error message.
   *
   * @param {...any} data - The error message.
   */
  error(...data) {
    this.#apply({
      type: "error",
      data,
      color: this.#colors?.red,
      date: date().toString(),
    });
  }

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  group(...data) {
    if (data.length) this.#apply({ type: "log", data });
    this.#groups++;
  }

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  groupCollapsed(...data) {
    if (data.length) this.#apply({ type: "log", data });
    this.#groups++;
  }

  /**
   * Ends a group of logs.
   */
  groupEnd() {
    if (this.#groups > 0) this.#groups--;
  }

  /**
   * Logs an information message.
   *
   * @param {...any} data - The message to log.
   */
  info(...data) {
    this.#apply({
      type: "info",
      data,
      color: this.#colors?.cyan,
      date: date().toString(),
    });
  }

  /**
   * Logs a message.
   *
   * @param {...any} data - The success message.
   */
  log(...data) {
    this.#apply({ type: "log", data, date: date().toString() });
  }

  /**
   * Starts a profile measurement.
   *
   * @param {string} key - The key of the profile measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  profile(key, force) {
    if (!force && this.#timers[key])
      return console.warn(`${key} already exists.`);
    this.#timers[key] = date();
  }

  /**
   * Ends a profile measurement.
   *
   * @param {string} key - The key of the profile measurement.
   */
  profileEnd(key) {
    if (!this.#timers[key]) return;
    this.timeStamp(key);
    delete this.#timers[key];
  }

  /**
   * Logs a success message.
   *
   * @param {...any} data - The success message.
   */
  success(...data) {
    this.#apply({
      type: "success",
      data,
      color: this.#colors?.green,
      date: date().toString(),
    });
  }

  /**
   * Logs a table.
   *
   * @param {Array<any>} data - The data to log as a table.
   * @param {string} properties - The properties to include in the table header.
   */
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

  /**
   * Logs a time measurement start.
   *
   * @param {string} key - The key of the time measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  time(key, force) {
    if (!force && this.#timers[key])
      return console.warn(`${key} already exists.`);
    this.#timers[key] = date();
  }

  /**
   * Logs a time measurement end.
   *
   * @param {string} key - The key of the time measurement.
   * @param {boolean} print - Whether to print the time difference. Defaults to true.
   */
  timeEnd(key, print) {
    if (!this.#timers[key]) return;
    if (print !== false) this.timeStamp(key);
    delete this.#timers[key];
  }

  /**
   * Logs a time measurement log.
   *
   * @param {string} key - The key of the time measurement.
   * @param {...any} data - The message to log.
   */
  timeLog(key, ...data) {
    if (!this.#timers[key]) return;
    data.push(
      `${this.#colors?.reset + this.#colors?.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
    );
    this.#apply({ type: "timeLog", data, date: date().toString() });
  }

  /**
   * Logs a timestamp.
   *
   * @param {string} key - The key of the time measurement.
   */
  timeStamp(key) {
    if (!this.#timers[key]) return;
    this.#apply({
      type: "warn",
      data: [
        `${key} ${this.#colors?.reset + this.#colors?.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
      ],
      date: date().toString(),
    });
  }

  /**
   * Logs a trace message.
   *
   * @param {...any} data - The message to log.
   */
  trace(...data) {
    this.#apply({ type: "trace", data, date: date().toString(), trace: true });
  }

  /**
   * Logs a warning message.
   *
   * @param {...any} data - The warning message.
   */
  warn(...data) {
    this.#apply({
      type: "warn",
      data,
      color: this.#colors?.yellow,
      date: date().toString(),
    });
  }

  /**
   * @param {Object} options
   * @param {string} options.type
   * @param {any[]} options.data
   * @param {string} [options.color]
   * @param {string} [options.date] 
   * @param {boolean} [options.trace]
   */
  #apply({ type, data, color, date, trace }) {
    if (!(data?.length > 0)) return;
    let message = this.#date && date ? `${this.#colors?.dim || ""}[${date}]${color || this.#colors?.reset || ""} ` : (color || "");
    message += "\t".repeat(this.#groups);
    for (let i = 0, len = data.length; i < len; i++) {
      const value = data[i];
      message += (i === 0 ? "" : " ") + (typeof value === "object" ? JSON.stringify(value, duplicateReplacer(), 4) : value);
    }
    if (trace || this.#trace) message += "\n" + new Error().stack.split("\n").slice(1).filter((line) => !line.includes(import.meta.url)).join("\n");
    message += this.#colors?.reset || "";
    const log = { type, message, data, color, date, trace };
    this.#logs.push(log);
    if (this.#writer) return this.#writer.write(log);
    if (this.#debug || !IS_TTY) return logs.push((write(log), { instance: this, index: this.#index, log }));
    const index = findLogIndex(this.#index);
    if (index == -1) return logs.push((write(log), { instance: this, index: this.#index, log }));
    logs.splice(index, 0, { instance: this, index: this.#index, log });
    clear();
    for (let i = 0, len = logs.length; i < len; i++) write(logs[i].log);
  }
}

export default Console;
export { Console, COLORS as colors };

function duplicateReplacer(set = new WeakSet()) {
  return function (_, value) {
    if (typeof value === "object" && value !== null) {
      if (set.has(value)) {
        return;
      }
      set.add(value);
    }
    return value;
  };
}

function findLogIndex(index) {
  for (let i = 0, len = logs.length; i < len; i++)
    if (index < logs[i].index) return i;
  return -1;
}

