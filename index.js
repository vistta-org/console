// @ts-check
import { date } from "@vistta/date-time";
const logs = [];
const _stdout = { write: console.log.bind(console) };
const _stderr = { write: console.error.bind(console) };
const _clear = await (async () => {
  if (typeof process === "undefined" || process.platform !== 'win32') return console.clear.bind(console);
  const { execSync } = await import("node:child_process");
  return () => execSync("powershell.exe Clear-Host");
})();
const clears = [];
const system = Symbol("system");
const isTTY = typeof process === "undefined" || process.stdout.isTTY;

/**
 * A class for creating and managing console logs.
 *
 * @class Console
 */
class Console {
  /**
   * @typedef {Object} Writable
   * @property {Function} write - Target directory
   */
  #timers = {};
  #counts = {};
  #groups = 0;
  #index;
  #date;
  #debug;
  #trace;
  #stdout;
  #stderr;
  #clear;
  #custom

  /**
   * @returns {string} Code to reset the console color.
   */
  get reset() {
    return typeof process === "undefined" ? "" : "\x1b[0m";
  }

  /**
   * @returns {string} Code to make the text bright.
   */
  get bright() {
    return typeof process === "undefined" ? "" : "\x1b[1m";
  }

  /**
   * @returns {string} Code to make the text dim.
   */
  get dim() {
    return typeof process === "undefined" ? "" : "\x1b[2m";
  }

  /**
   * @returns {string} Code to underline the text.
   */
  get underscore() {
    return typeof process === "undefined" ? "" : "\x1b[4m";
  }

  /**
   * @returns {string} Code to blink the text.
   */
  get blink() {
    return typeof process === "undefined" ? "" : "\x1b[5m";
  }

  /**
   * @returns {string} Code to reverse the text color.
   */
  get reverse() {
    return typeof process === "undefined" ? "" : "\x1b[7m";
  }

  /**
   * @returns {string} Code to set the text color to black.
   */
  get black() {
    return typeof process === "undefined" ? "" : "\x1b[30m";
  }

  /**
   * @returns {string} Code to set the text color to red.
   */
  get red() {
    return typeof process === "undefined" ? "" : "\x1b[31m";
  }

  /**
   * @returns {string} Code to set the text color to green.
   */
  get green() {
    return typeof process === "undefined" ? "" : "\x1b[32m";
  }

  /**
   * @returns {string} Code to set the text color to yellow.
   */
  get yellow() {
    return typeof process === "undefined" ? "" : "\x1b[33m";
  }

  /**
   * @returns {string} Code to set the text color to blue.
   */
  get blue() {
    return typeof process === "undefined" ? "" : "\x1b[34m";
  }

  /**
   * @returns {string} Code to set the text color to magenta.
   */
  get magenta() {
    return typeof process === "undefined" ? "" : "\x1b[35m";
  }

  /**
   * @returns {string} Code to set the text color to cyan.
   */
  get cyan() {
    return typeof process === "undefined" ? "" : "\x1b[36m";
  }

  /**
   * @returns {string} Code to set the text color to white.
   */
  get white() {
    return typeof process === "undefined" ? "" : "\x1b[37m";
  }

  /**
   * @returns {typeof Console} Console Instance Class.
   */
  get Console() {
    return Console;
  }

  /**
   * @returns {number} Console instance Position Index.
   */
  get index() {
    return this.#index;
  }

  /**
   * @returns {string[]} Console instance logs
   */
  get logs() {
    return [];
  }

  /**
   * @returns {Writable} Console instance stdout
   */
  get stdout() {
    return this.#stdout;
  }

  /**
   * @returns {Writable} Console instance stderr
   */
  get stderr() {
    return this.#stderr;
  }

  /**
   * Creates a new Console instance.
   * 
   * @param {Object} [options] - Optional configuration options.
   * @param {Writable} [options.stdout] - Writable Stream.
   * @param {Writable} [options.stderr] - Writable Stream.
   * @param {Function} [options.clear] - Function to clear the Stream if available.
   * @param {boolean} [options.date] - Whether to include the date in logs. Defaults to true.
   * @param {boolean} [options.trace] - Whether to include the stack trace in logs. Defaults to the value of the `NODE_TRACE` environment variable.
   * @param {boolean} [options.debug] - Whether to enable debug mode. Defaults to the value of the `NODE_DEBUG` environment variable.
   * @param {number} [options.index] - The index of the console. Defaults to 0.
   */
  constructor(options) {
    // @ts-ignore
    const isSystem = options === system;
    // @ts-ignore
    const { stdout, stderr, clear, date, trace, debug, index = 0, } = (isSystem ? { index: -1337, date: false } : options) || {};
    if (!isSystem && index < 0) throw new TypeError("The index needs to be a positive number or 0");
    this.#stdout = stdout || _stdout;
    this.#stderr = stderr || _stderr;
    this.#clear = clear || _clear;
    const prototype = Object.getPrototypeOf(this);
    const functions = Object.getOwnPropertyNames(prototype);
    for (let i = 0, len = functions.length; i < len; i++) {
      if (functions[i] === "constructor") continue;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, functions[i]);
      if (typeof descriptor.get === 'undefined' && typeof descriptor.set === 'undefined')
        this[functions[i]] = this[functions[i]].bind(this);
    }
    this.#date = date !== false;
    this.#custom = this.#stdout !== _stdout || this.#stderr !== _stderr;
    this.#debug = debug == null ? process.env.NODE_DEBUG : debug;
    this.#trace = trace == null ? process.env.NODE_TRACE : trace;
    this.#index = index;
    let exits = false;
    for (let i = 0, len = clears.length; i < len; i++) {
      if (clears[i] !== this.#clear) continue;
      exits = true;
      break;
    }
    if (!exits) clears.push(this.#clear), this.#clear();
  }

  /**
   * Announces a message.
   *
   * @param {...any} data - The message to announce.
   */
  announce(...data) {
    this.#apply({ type: "announce", data, color: this.bright });
  }

  /**
   * Asserts a condition.
   *
   * @param {boolean} condition - The condition to assert.
   * @param {...any} data - The message to log if the condition fails.
   */
  assert(condition, ...data) {
    if (condition)
      data.unshift(`${this.green}Assertion passed${this.reset}`);
    else data.unshift(`${this.red}Assertion failed${this.reset}`);
    this.#apply({ type: "assert", data });
  }

  /**
   * Clears the console.
   */
  clear() {
    if (this.#debug || (!this.#custom && !isTTY)) return;
    if (this.#custom) this.#clear();
    else clear();
    let i = 0;
    while (logs[i]) {
      if (logs[i].instance === this) logs.splice(i, 1);
      else {
        if (!this.#custom) write(logs[i]);
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
      color: this.red,
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
      color: this.cyan,
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
      color: this.green,
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
      `${this.reset + this.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
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
        `${key} ${this.reset + this.dim}(${date().diff(this.#timers[key], "second", true)}s)`,
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
      color: this.yellow,
      date: date().toString(),
    });
  }

  //

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
    const log = { instance: this, type, date, message: "" };
    let initial = color || "";
    if (this.#date && date)
      initial = `${this.dim}[${date}]${color || this.reset} `;
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
      log.message += "\n" + new Error().stack.split("\n").slice(1).filter((line) => !line.includes(import.meta.url)).join("\n");
    log.message += this.reset;
    if (this.#debug || !isTTY) return logs.push(write(log, true));
    if (this.#custom) return logs.push(write(log));
    const index = findLogIndex(log);
    if (index == -1) return logs.push(write(log));
    logs.splice(index, 0, log);
    clear();
    for (let i = 0, len = logs.length; i < len; i++) write(logs[i]);
  }
}

// @ts-ignore
global.console = new Console();
// @ts-ignore
global.system = new Console(system);

function write(log, force) {
  if (log.type === "error") {
    if (!force && log.instance.index >= 0 && log.instance.stderr === _stderr && process.env.NODE_CONSOLE === "false") return log;
    log.instance?.stderr?.write(log.message);
  }
  else {
    if (!force && log.instance.index >= 0 && log.instance.stdout === _stdout && process.env.NODE_CONSOLE === "false") return log;
    log.instance?.stdout?.write(log.message);
  }
  return log;
}

function clear() {
  for (let i = 0, len = clears.length; i < len; i++) clears[i]();
}

function findLogIndex(log) {
  for (let i = 0, len = logs.length; i < len; i++)
    if (log.instance.index < logs[i].instance.index) return i;
  return -1;
}

