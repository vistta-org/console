import { BoundClass, DateTime } from "@vistta/utils";
import { BRIGHT, CYAN, DIM, GREEN, RED, RESET, YELLOW } from "./colors.js";
import { toString as defaultToString } from "./modifiers/default.js";

export const IS_TTY = typeof process === "undefined" || process?.stdout?.isTTY;
const CONSOLE_FALLBACK = console;

/**
 * @typedef {Object} Colors
 * @property {string} reset - Reset code.
 * @property {string} [time] - Time color code.
 * @property {string} [error] - Error color code.
 * @property {string} [warn] - Warning color code.
 * @property {string} [success] - Success color code.
 * @property {string} [info] - Info color code.
 * @property {string} [announce] - Announce color code.
 */
const defaultColors = {
  reset: RESET,
  time: DIM,
  error: RED,
  warn: YELLOW,
  success: GREEN,
  info: CYAN,
  announce: BRIGHT,
};

class Log {
  constructor(type, data, group, timer) {
    if (!(data?.length > 0)) data = [""];
    this.type = type;
    this.data = data;
    this.timer = timer;
    this.time = new DateTime({
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false, // Use 24-hour format
    });
    this.trace = new Error().stack
      ?.split("\n")
      ?.slice(1)
      ?.filter((line) => !line.includes(import.meta.url));
    if (group) this.group = group;
  }

  toString() {
    switch (this.type) {
      default:
        return defaultToString(this.data);
    }
  }
}

/**
 * A class for creating and managing console logs.
 *
 * @class Console
 */
export class Console extends BoundClass {
  #active = true;
  #log;
  #logs = [];
  #timers = {};
  #counts = {};
  #groups = 0;
  #stdout;
  #stderr;
  #stdclear;
  #time;
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
   * @property {WritableStreamDefaultWriter | boolean} [stdout] - Writable Out Stream.
   * @property {WritableStreamDefaultWriter | boolean} [stderr] - Writable Error Stream. Defaults to stdout.
   * @property {Function | boolean} [stdclear] - Function to clear the Stream if available.
   * @property {boolean} [time] - Whether to include the time in logs. Defaults to true.
   * @property {boolean | Colors} [colors] - Whether to include colors in logs or object of the colors. Defaults to true if no writer is passed.
   * @property {boolean} [trace] - Whether to include the stack trace in logs. Defaults to the value of the `NODE_TRACE` environment variable.
   * @property {boolean} [debug] - Whether to enable debug mode. Defaults to the value of the `NODE_DEBUG` environment variable.
   *
   * @param {Options} [options] - Optional configuration options or true for system default.
   */
  // @ts-ignore
  constructor({ stdout, stderr, stdclear, time, colors, trace, debug, ...options } = {}) {
    super();
    if (typeof options["#log"] !== "undefined") this.#log = options["#log"];
    if (stdout === undefined || stdout === true) {
      if (typeof process === "undefined") this.#stdout = { write: (...args) => CONSOLE_FALLBACK.log(...args) };
      else this.#stdout = process.stdout;
      if (stderr === true) {
        if (typeof process === "undefined")
          this.#stderr = {
            write: (...args) => CONSOLE_FALLBACK.error(...args),
          };
        else this.#stderr = process.stderr;
      } else if (!stderr || typeof stderr.write === "function") this.#stderr = stderr;
      else throw new TypeError("Console expects a writable stream instance for stderr");
      if (stdclear === undefined || stdclear === true) this.#stdclear = CONSOLE_FALLBACK.clear.bind(CONSOLE_FALLBACK);
      else if (!stdclear || typeof stdclear === "function") this.#stdclear = stdclear;
      else throw new TypeError("Console expects a function instance for stdclear");
    } else if (!stdout || typeof stdout.write === "function") {
      this.#stdout = stdout;
      if (!stdclear || typeof stdclear === "function") this.#stdclear = stdclear;
      else throw new TypeError("Console expects a function instance for stdclear");
      if (stderr && typeof stderr === "object" && typeof stderr.write === "function") this.#stderr = stderr;
      else if (stderr) throw new TypeError("Console expects a writable stream instance for stderr");
    } else throw new TypeError("Console expects a writable stream instance for stdout");
    this.#time = time !== false;
    this.#debug = debug ?? process?.env?.NODE_DEBUG;
    this.#trace = trace ?? process?.env?.NODE_TRACE;
    if (colors === true) this.#colors = defaultColors;
    else if (colors === false) this.#colors = {};
    else this.#colors = colors || defaultColors;
  }

  /**
   * @typedef {Object} ConsoleManipulation
   * @property {((...data: any[]) => void) | ((replacer: (console: Console, previousData: any) => any) => void)} replace - Replaces the log entry with new data.
   * @property {() => void} remove - Removes the log entry.
   */

  /**
   * Announces a message.
   *
   * @param {...any} data - The message to announce.
   * @returns {ConsoleManipulation}
   */
  announce(...data) {
    return this.#write("announce", data);
  }

  /**
   * Asserts a condition.
   *
   * @param {boolean} condition - The condition to assert.
   * @param {...any} data - The message to log if the condition fails.
   * @returns {ConsoleManipulation}
   */
  assert(condition, ...data) {
    if (condition) data.unshift(`${this.#colors?.success || ""}Assertion passed${this.#colors?.success ? this.#colors.reset : ""}`);
    else data.unshift(`${this.#colors?.error}Assertion failed${this.#colors?.error ? this.#colors.reset : ""}`);
    return this.#write("log", data);
  }

  /**
   * Clears the console.
   */
  clear() {
    this.#logs = [];
    if (this.#debug || !IS_TTY) return;
    this.#stdclear?.();
  }

  /**
   * Increments a counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  count(key = "") {
    if (!this.#counts[key]) this.#counts[key] = 0;
    this.#write("log", [`${key}: ${this.#counts[key]++}`]);
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
   * Logs a message without the time log.
   *
   * @param {...any} data - The message to log.
   * @returns {ConsoleManipulation}
   */
  print(...data) {
    return this.#write("print", data);
  }

  /**
   * Logs a new line without the time log.
   */
  println() {
    return this.#write("print", [""]);
  }

  /**
   * Logs a debug message.
   *
   * @param {...any} data - The message to log.
   * @returns {ConsoleManipulation}
   */
  debug(...data) {
    return this.#write("debug", data);
  }

  /**
   * Logs an object.
   *
   * @param {Object} object - The object to log.
   * @returns {ConsoleManipulation}
   */
  dir(object) {
    return this.#write("log", [object]);
  }

  /**
   * Logs an XML object.
   *
   * @param {Object} object - The XML object to log.
   * @returns {ConsoleManipulation}
   */
  dirxml(object) {
    return this.#write("log", [object]);
  }

  /**
   * Logs an error message.
   *
   * @param {...any} data - The error message.
   * @returns {ConsoleManipulation}
   */
  error(...data) {
    return this.#write("error", data);
  }

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  group(...data) {
    if (data.length) this.#write("log", data);
    this.#groups++;
  }

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  groupCollapsed(...data) {
    if (data.length) this.#write("log", data);
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
   * @returns {ConsoleManipulation}
   */
  info(...data) {
    return this.#write("info", data);
  }

  /**
   * Logs a message.
   *
   * @param {...any} data - The success message.
   * @returns {ConsoleManipulation}
   */
  log(...data) {
    return this.#write("log", data);
  }

  /**
   * Starts a profile measurement.
   *
   * @param {string} key - The key of the profile measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  profile(key, force) {
    if (!force && this.#timers[key]) return console.warn(`${key} already exists.`);
    this.#timers[key] = new DateTime();
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
   * @returns {ConsoleManipulation}
   */
  success(...data) {
    return this.#write("success", data);
  }

  /**
   * Logs a table.
   *
   * @param {Array<any>} data - The data to log as a table.
   * @param {string} properties - The properties to include in the table header.
   * @returns {ConsoleManipulation}
   */
  table(data, properties) {
    return this.#write("success", { data, properties });
    /*if (!Array.isArray(data) || data.length === 0) return;
    const isObject = typeof data[0] === "object";
    const headers = [
      "(index)",
      ...(isObject ? Object.keys(data[0]) : ["Values"]),
    ];
    properties = properties || headers.join("\t");
    return this.#apply({
      type: "table",
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
    });*/
  }

  /**
   * Logs a time measurement start.
   *
   * @param {string} key - The key of the time measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  time(key, force) {
    if (!force && this.#timers[key]) return this.warn(`${key} already exists.`);
    this.#timers[key] = new DateTime();
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
   * @returns {ConsoleManipulation}
   */
  timeLog(key, ...data) {
    return this.#write("log", data, key);
  }

  /**
   * Logs a timestamp.
   *
   * @param {string} key - The key of the time measurement.
   * @returns {ConsoleManipulation}
   */
  timeStamp(key) {
    return this.#write("log", [key], key);
  }

  /**
   * Logs a trace message.
   *
   * @param {...any} data - The message to log.
   * @returns {ConsoleManipulation}
   */
  trace(...data) {
    return this.#write("trace", data);
  }

  /**
   * Logs a warning message.
   *
   * @param {...any} data - The warning message.
   * @returns {ConsoleManipulation}
   */
  warn(...data) {
    return this.#write("warn", data);
  }

  /**
   * Enables the whole console, the trace or debug mode.
   *
   * @param {"trace" | "debug" | null} target - The target to disable.
   */
  enable(target) {
    switch (target) {
      case "trace":
        this.#trace = true;
        break;
      case "debug":
        this.#debug = true;
        break;
      default:
        this.#active = true;
        break;
    }
  }

  /**
   * Disables the whole console, the trace or debug mode.
   *
   * @param {"trace" | "debug" | null} target - The target to disable.
   */
  disable(target) {
    switch (target) {
      case "trace":
        this.#trace = false;
        break;
      case "debug":
        this.#debug = false;
        break;
      default:
        this.#active = false;
        break;
    }
  }

  #write(type, data, timer) {
    if (this.#log) return Object.assign(this.#log, { type, data, timer });
    const log = new Log(type, data, this.#groups, timer);
    if (!log || (timer && !this.#timers[timer])) return;
    this.#logs.push(log);
    if (this.#active) {
      if (log.type === "error" && this.#stderr) this.#stderr.write(format(log, this.#time, this.#trace, this.#colors, this.#timers));
      else if (this.#stdout) this.#stdout.write(format(log, this.#time, this.#trace, this.#colors, this.#timers));
    }

    const logs = this.#logs;
    const options = { ["#log"]: log, trace: this.#trace, colors: this.#colors };
    const refresh = () => {
      if (this.#debug || !IS_TTY || !this.#active) return;
      this.#stdclear?.();
      for (let i = 0, len = this.#logs.length; i < len; i++) {
        const log = this.#logs[i];
        if (log.type === "error" && this.#stderr) this.#stderr.write(format(log, this.#time, this.#trace, this.#colors, this.#timers));
        else if (this.#stdout) this.#stdout.write(format(log, this.#time, this.#trace, this.#colors, this.#timers));
      }
    };

    return {
      replace(replacer, ...data) {
        if (typeof replacer === "function" && data.length === 0) {
          // @ts-ignore
          const console = new Console(options);
          const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(console));
          const actions = {};
          for (let i = 0, len = methods.length; i < len; i++) {
            if (
              [
                "constructor",
                "clear",
                "count",
                "countReset",
                "group",
                "groupCollapsed",
                "groupEnd",
                "profile",
                "profileEnd",
                "time",
                "timeEnd",
                "enable",
                "disable",
              ].indexOf(methods[i]) !== -1
            )
              continue;
            actions[methods[i]] = (...args) => console[methods[i]](...args);
          }
          const result = replacer(actions, log.data);
          if (!(result instanceof Log)) log.data = result;
        } else log.data = (data.unshift(replacer), data);
        refresh();
        return this;
      },
      remove() {
        for (let i = 0, len = logs.length; i < len; i++) {
          if (logs[i] !== log) continue;
          logs.splice(i, 1);
          refresh();
          return;
        }
      },
    };
  }
}

export * as COLORS from "./colors.js";

function format(log, displayTime, forceTrace, colors, timers) {
  const withColor = (type, text) => (colors?.[type] || "") + text + (colors?.[type] ? colors.reset : "");

  return (
    (log.type !== "print" && displayTime ? withColor("time", log.time.toString().replace(",", "").replace(",", ".") + "  ") : "") +
    withColor(log.type, log.toString()) +
    (log.timer != null ? withColor("time", ` (${new DateTime().diff(timers[log.timer], "second", true)}s)`) : "") +
    (log.type === "trace" || forceTrace ? withColor(log.type, "\n" + log.trace.join("\n")) : "") +
    "\n"
  );
}
