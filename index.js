import { BoundClass, DateTime } from "@vistta/utils";
import { BRIGHT, CYAN, DIM, GREEN, RED, RESET, YELLOW } from "./colors.js";
import { toString as defaultToString, table as formatTable } from "./modifiers/default.js";

export const IS_TTY = typeof process === "undefined" || process?.stdout?.isTTY;
const CONSOLE_FALLBACK = console;
/** @type {OutputStream} */
const FALLBACK_STDOUT = { write: (text) => CONSOLE_FALLBACK.log(text) };
/** @type {OutputStream} */
const FALLBACK_STDERR = { write: (text) => CONSOLE_FALLBACK.error(text) };
const TERMINAL = {};
let outputSequence = 0;

/**
 * @typedef {{
 *   write: (text: string, callback?: (error?: Error | null) => void) => unknown,
 *   isTTY?: boolean,
 *   ready?: PromiseLike<unknown>,
 *   once?: (event: string, listener: (...args: any[]) => void) => unknown,
 *   removeListener?: (event: string, listener: (...args: any[]) => void) => unknown
 * }} OutputStream
 * @typedef {{ sequence: number, log: Log, stream: OutputStream, render: () => string }} OutputEntry
 */

/**
 * @param {unknown} value
 * @returns {value is PromiseLike<unknown>}
 */
function isPromise(value) {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    "then" in value &&
    typeof value.then === "function"
  );
}

/**
 * @param {OutputStream} stream
 * @param {string} text
 */
function writeStream(stream, text) {
  if (stream.ready) return Promise.resolve(stream.ready).then(() => stream.write(text));
  if (stream.once && stream.removeListener) {
    let resolveWrite;
    let rejectWrite;
    const pending = new Promise((resolve, reject) => {
      resolveWrite = () => resolve(undefined);
      rejectWrite = reject;
    });
    let completed = false;
    let drained = false;
    let returned = false;
    const cleanup = () => {
      stream.removeListener("error", fail);
      stream.removeListener("close", close);
      stream.removeListener("drain", drain);
    };
    const finish = () => {
      if (!returned || !completed || !drained) return;
      cleanup();
      resolveWrite();
    };
    const fail = (error) => {
      cleanup();
      rejectWrite(error);
    };
    const close = () => fail(new Error("Console output stream closed before the write completed"));
    const drain = () => {
      drained = true;
      finish();
    };
    stream.once("error", fail);
    stream.once("close", close);
    stream.once("drain", drain);
    try {
      const result = stream.write(text, (error) => {
        if (error) {
          // Node emits the error event after invoking the write callback.
          stream.removeListener("drain", drain);
          rejectWrite(error);
          return;
        }
        completed = true;
        finish();
      });
      if (result !== false) drained = true;
      returned = true;
      finish();
    } catch (error) {
      cleanup();
      throw error;
    }
    return pending;
  }
  const result = stream.write(text);
  if (result === false) throw new TypeError("Console output returning false must support drain events");
  return result;
}

class Output {
  /** @type {OutputEntry[]} */
  entries = [];
  /** @type {Function | undefined} */
  clear;
  /** @type {boolean} */
  isTTY;
  /** @type {Promise<void> | undefined} */
  #pending;
  #failed = false;
  #error;

  /** @param {boolean} isTTY */
  constructor(isTTY) {
    this.isTTY = isTTY;
  }

  /**
   * @param {Log} log
   * @param {OutputStream} stream
   * @param {() => string} render
   */
  write(log, stream, render) {
    const text = render();
    this.#enqueue(() => writeStream(stream, text));
    const entry = { sequence: outputSequence++, log, stream, render };
    this.entries.push(entry);
    return entry;
  }

  /** @param {OutputEntry} entry */
  add(entry) {
    const index = this.entries.findIndex((current) => current.sequence > entry.sequence);
    this.entries.splice(index === -1 ? this.entries.length : index, 0, entry);
  }

  /** @param {Log[]} logs */
  remove(logs) {
    this.entries = this.entries.filter((entry) => !logs.includes(entry.log));
  }

  refresh() {
    if (!this.isTTY || !this.clear) return;
    const entries = this.entries.map((entry) => ({ stream: entry.stream, text: entry.render() }));
    this.#enqueue(() => this.clear());
    for (const entry of entries) this.#enqueue(() => writeStream(entry.stream, entry.text));
  }

  async flush() {
    while (this.#pending) await this.#pending;
    if (this.#failed) throw this.#error;
  }

  /** @param {() => unknown} action */
  #enqueue(action) {
    if (this.#failed) throw this.#error;
    let result;
    if (this.#pending) {
      result = this.#pending.then(() => {
        if (this.#failed) throw this.#error;
        return action();
      });
    } else {
      try {
        result = action();
      } catch (error) {
        this.#failed = true;
        this.#error = error;
        throw error;
      }
    }
    if (!isPromise(result)) return;
    const pending = Promise.resolve(result).then(
      () => {},
      (error) => {
        if (this.#failed) return;
        this.#failed = true;
        this.#error = error;
        CONSOLE_FALLBACK.error("Console output failed:", error);
      },
    );
    this.#pending = pending;
    pending.then(() => {
      if (this.#pending === pending) this.#pending = undefined;
    });
  }
}

/** @type {WeakMap<object, Output>} */
const OUTPUTS = new WeakMap();

/**
 * @param {OutputStream} stream
 * @param {Function | boolean | null | undefined} clear
 */
function getOutput(stream, clear) {
  const isTTY = stream.isTTY === true;
  const key =
    typeof process !== "undefined" &&
    process.stdout?.isTTY === true &&
    process.stderr?.isTTY === true &&
    (stream === process.stdout || stream === process.stderr)
      ? TERMINAL
      : stream;
  let output = OUTPUTS.get(key);
  if (!output) {
    output = new Output(isTTY);
    OUTPUTS.set(key, output);
  }
  if (!output.clear && typeof clear === "function") output.clear = clear;
  return output;
}

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
const NO_COLORS = { reset: "" };

/**
 * @typedef {"announce" | "print" | "debug" | "error" | "info" | "log" | "success" | "trace" | "warn"} LogType
 */

class Log {
  /** @type {LogType} */
  type;
  /** @type {any[]} */
  data;
  /** @type {number | undefined} */
  timer;
  /** @type {DateTime} */
  time;
  /** @type {string[]} */
  trace;
  /** @type {number | undefined} */
  group;

  /**
   * @param {LogType} type - The log type.
   * @param {any[]} [data] - Log data.
   * @param {Object} [options] - Additional options for the log entry.
   * @param {number} [options.group] - Group depth for this entry.
   * @param {DateTime} [options.time] - Custom time for the log entry.
   * @param {string[]} [options.trace] - Custom stack trace for the log entry.
   * @param {number} [options.timer] - Timer key associated with this entry.
   */
  constructor(type, data, { group, timer, time, trace } = {}) {
    if (!(data?.length > 0)) data = [""];
    /** @type {LogType} */
    this.type = type;
    /** @type {any[]} */
    this.data = data;
    /** @type {number | undefined} */
    this.timer = timer;
    /** @type {DateTime} */
    this.time = new DateTime(
      time || {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        hour12: false, // Use 24-hour format
      },
    );
    /** @type {string[]} */
    this.trace = trace || [];
    /** @type {number | undefined} */
    if (group) this.group = group;
  }

  /**
   * Formats the log entry as a string.
   *
   * @param {Object} options - Formatting options.
   * @param {boolean} [options.time] - Whether to include the time in the output. Defaults to true.
   * @param {boolean} [options.trace] - Whether to include the stack trace in the output. Defaults to true.
   * @param {Colors} [options.colors] - An object containing color codes for different log types.
   * @param {Object} [options.timers] - An object containing timer start times for calculating elapsed time.
   * @returns {string}
   */
  toString({ time = true, trace = true, colors } = {}) {
    const withColor = (type, text) => (colors?.[type] || "") + text + (colors?.[type] ? colors?.reset : "");
    const text =
      (this.type !== "print" && time
        ? withColor("time", this.time.toString().replace(",", "").replace(",", ".") + "  ")
        : "") +
      withColor(this.type, defaultToString(this.data)) +
      (this.timer != null ? withColor("time", ` (${this.timer}s)`) : "") +
      ((this.type === "trace" || trace) && this.trace.length ? withColor(this.type, "\n" + this.trace.join("\n")) : "");
    const indent = "  ".repeat(this.group || 0);
    return (
      text
        .split("\n")
        .map((line) => indent + line)
        .join("\n") + "\n"
    );
  }

  clone() {
    return new Log(this.type, this.data, { group: this.group, timer: this.timer, time: this.time, trace: this.trace });
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
  /** @type {Output | undefined} */
  #out;
  /** @type {Output | undefined} */
  #err;
  #time;
  #colors;
  #debug;
  #trace;
  #maxHistory;

  /**
   * @returns {typeof Console} Console Instance Class.
   */
  get Console() {
    return Console;
  }

  /**
   * @returns {Log[]} Console instance logs
   */
  get logs() {
    return this.#logs.map((log) => log.clone());
  }

  /**
   * Creates a new Console instance.
   *
   * @typedef {Object} Options
   * @property {OutputStream | boolean | null} [stdout] - Writable Out Stream.
   * @property {OutputStream | boolean | null} [stderr] - Writable Error Stream. Defaults to stdout.
   * @property {Function | boolean} [stdclear] - Function to clear the Stream if available.
   * @property {boolean} [time] - Whether to include the time in logs. Defaults to true.
   * @property {boolean | Colors} [colors] - Color override. By default colors are enabled only for TTY destinations.
   * @property {boolean} [trace] - Whether to include the stack trace in logs. Defaults to the value of the `NODE_TRACE` environment variable.
   * @property {boolean} [debug] - Whether to enable debug mode. Defaults to the value of the `NODE_DEBUG` environment variable.
   * @property {number} [maxHistory] - Maximum retained entries per logger. Defaults to Infinity; zero disables history.
   *
   * @param {Options} [options] - Optional configuration options or true for system default.
   */
  // @ts-ignore
  constructor({ stdout, stderr, stdclear, time, colors, trace, debug, maxHistory = Infinity, ...options } = {}) {
    super();
    if (maxHistory !== Infinity && (!Number.isInteger(maxHistory) || maxHistory < 0))
      throw new RangeError("Console maxHistory must be a non-negative integer or Infinity");
    this.#maxHistory = maxHistory;
    if (typeof options["#log"] !== "undefined") this.#log = options["#log"];
    if (stdout === undefined || stdout === true) {
      if (typeof process === "undefined") this.#stdout = FALLBACK_STDOUT;
      else this.#stdout = process.stdout;
      if (stderr === true) {
        if (typeof process === "undefined") this.#stderr = FALLBACK_STDERR;
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
    this.#debug = debug ?? (typeof process !== "undefined" ? process.env?.NODE_DEBUG : undefined);
    this.#trace = trace ?? (typeof process !== "undefined" ? process.env?.NODE_TRACE : undefined);
    if (colors === true) this.#colors = defaultColors;
    else if (colors === false) this.#colors = NO_COLORS;
    else this.#colors = colors;
    if (!this.#log) {
      if (this.#stdout) this.#out = getOutput(this.#stdout, this.#stdclear);
      if (this.#stderr) this.#err = getOutput(this.#stderr, this.#stdclear);
    }
  }

  /**
   * @typedef {Object} ConsoleManipulation
   * @property {((...data: any[]) => ConsoleManipulation) & ((replacer: (console: Console, previousData: any) => any) => ConsoleManipulation)} replace - Replaces the log entry with new data.
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
   * @returns {ConsoleManipulation | undefined}
   */
  assert(condition, ...data) {
    if (condition) return;
    return this.#write("error", ["Assertion failed", ...data]);
  }

  /**
   * Clears the console.
   */
  clear() {
    for (const output of new Set([this.#out, this.#err])) {
      output?.remove(this.#logs);
      if (!this.#debug && this.#active) output?.refresh();
    }
    this.#logs.length = 0;
  }

  /**
   * Waits for queued writes and redraws on both shared output owners.
   * @returns {Promise<void>}
   */
  async flush() {
    await Promise.all([...new Set([this.#out, this.#err])].map((output) => output?.flush()));
  }

  /**
   * Increments a counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  count(key = "") {
    if (!this.#counts[key]) this.#counts[key] = 0;
    this.#write("log", [`${key}: ${++this.#counts[key]}`]);
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
   * @param {any} data - Array or object to log as a table; other values are logged normally.
   * @param {string[]} [properties] - Object properties to include in the table.
   * @returns {ConsoleManipulation}
   */
  table(data, properties) {
    return this.#write("log", [formatTable(data, properties)]);
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
   * @param {boolean} [print] - Whether to print the time difference. Defaults to true.
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
   * @param {"trace" | "debug" | null} [target] - The target to disable.
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
   * @param {"trace" | "debug" | null} [target] - The target to disable.
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
    if (timer && this.#timers[timer]) timer = new DateTime().diff(this.#timers[timer], "second", true);
    const trace =
      this.#trace || type === "trace"
        ? new Error().stack
            ?.split("\n")
            .slice(1)
            .filter((line) => !line.includes(import.meta.url)) || []
        : [];
    if (this.#log) return Object.assign(this.#log, { type, data, timer, trace });
    const log = new Log(type, data, {
      group: this.#groups,
      timer: timer,
      trace,
    });
    this.#logs.push(log);
    const stream = log.type === "error" && this.#stderr ? this.#stderr : this.#stdout;
    let output = log.type === "error" && this.#stderr ? this.#err : this.#out;
    /** @type {OutputEntry | undefined} */
    let entry;
    if (this.#active && stream && output) {
      entry = output.write(log, stream, () =>
        log.toString({
          time: this.#time,
          trace: !!this.#trace,
          colors: this.#colors ?? ((entry?.stream ?? stream).isTTY === true ? defaultColors : NO_COLORS),
        }),
      );
    }
    if (this.#logs.length > this.#maxHistory) {
      const discarded = this.#logs.splice(0, this.#logs.length - this.#maxHistory);
      for (const owner of new Set([this.#out, this.#err])) owner?.remove(discarded);
    }

    const logs = this.#logs;
    const options = { ["#log"]: log, stdout: null, trace: this.#trace, colors: this.#colors };
    const refresh = () => {
      const nextStream = log.type === "error" && this.#stderr ? this.#stderr : this.#stdout;
      const nextOutput = log.type === "error" && this.#stderr ? this.#err : this.#out;
      const previousOutput = output;
      if (entry) {
        if (nextStream) entry.stream = nextStream;
        if (nextOutput !== output) {
          output?.remove([log]);
          nextOutput?.add(entry);
        }
      }
      output = nextOutput;
      if (this.#debug || !this.#active) return;
      if (previousOutput !== output) previousOutput?.refresh();
      output?.refresh();
    };

    return {
      replace(replacer, ...data) {
        if (!logs.includes(log)) return this;
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
                "flush",
              ].indexOf(methods[i]) !== -1
            )
              continue;
            actions[methods[i]] = (...args) => console[methods[i]](...args);
          }
          const result = replacer(actions, log.data);
          if (!(result instanceof Log) && result !== undefined) log.data = Array.isArray(result) ? result : [result];
        } else log.data = (data.unshift(replacer), data);
        refresh();
        return this;
      },
      remove() {
        for (let i = 0, len = logs.length; i < len; i++) {
          if (logs[i] !== log) continue;
          logs.splice(i, 1);
          output?.remove([log]);
          refresh();
          return;
        }
      },
    };
  }
}

export * as COLORS from "./colors.js";
