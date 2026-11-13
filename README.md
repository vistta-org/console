# **VISTTA Console Library**

The `Console` object provides a set of methods for logging messages to the console. It allows for different log levels, formatting options, and time tracking.

## **Getting Started**

### **Install**

```sh
npm install @vistta/console
```

### **Usage**

```javascript
import { Console } from "@vistta/console";

const logger = new Console();

// Log a message
logger.log("Hello, world!");

// Log an error
logger.error("Something went wrong!");

// Log a warning
logger.warn("Attention required!");

// Log a debug message
logger.debug("This is a debug message.");

// Group messages
logger.group("Group 1");
logger.log("Message 1");
logger.log("Message 2");
logger.groupEnd();

// Time a function
logger.time("function_name");
// Function code here
logger.timeEnd("function_name");

// Independent loggers can share the same output.
const logger2 = new logger.Console({ time: false, colors: false });
logger.log("First logger");
logger2.log("Second logger");
```

### **Shared output streams**

Consoles using the same stream share one output owner. Each logger keeps its own
history, timers, counters, and formatting. Replacing or removing a log redraws
the shared output in write order, preserving entries from other loggers.
`clear()` removes only the calling logger's history and redraws the remaining
entries.

Streams must provide `write(text)` and may expose `isTTY: true`. Automatic colors
are enabled only for TTY destinations; `colors: true`, `colors: false`, or a
custom color object overrides this behavior. Non-TTY streams are append-only:
replacement, removal, and clearing update history without rewriting output.

TTY redraws require a `stdclear` callback that clears the destination. The first
available callback registered for a shared stream is used by its owner. Without
one, output remains append-only. Node's TTY `process.stdout` and `process.stderr`
share a terminal owner so clearing either preserves both channels' entries.
Other distinct streams have independent owners. Browser console fallback output
is append-only and does not receive automatic ANSI colors.

### **Writes and flushing**

Writers may be Node writable streams, Web Stream writers accepting strings, or
objects whose `write(text)` returns synchronously or returns a promise. Node
backpressure and Web writer readiness are respected. Writes and redraws are
serialized by the shared output owner.

```javascript
logger.log("Saved");
await logger.flush();
```

`flush()` waits for queued writes and redraws on both of the logger's shared
output owners, including writes from other loggers. It does not close the
streams or guarantee that the operating system has persisted data to disk.
Immediate synchronous write failures throw from the logging call. Failures
encountered during queued work are reported through the original console and
reject `flush()`. Await flushing before explicitly terminating the process. A failed output
owner stops accepting writes; subsequent calls throw the recorded error. A
replacement stream is needed to resume logging. A custom writer returning
`false` must support Node-style write callbacks and drain/error/close events.

### **History and formatting**

`new Console({ maxHistory: 1000 })` retains only the newest 1,000 entries for
that logger. The default is unlimited; `maxHistory: 0` writes without retaining
history. Limits must be non-negative integers or `Infinity`. Evicted entries
are removed from redraw history, and their replacement/removal handles become
inactive. Already displayed text remains until the next redraw. Other loggers'
histories are unaffected.

Stack traces are captured only for `trace()` or while trace mode is enabled.
Enabling trace mode does not retroactively capture stacks for older entries.
Objects support `Error` details and causes, `BigInt` values (shown with `n`),
and `Map`/`Set` contents. Circular references are shown as `[Circular]`; repeated
non-circular references retain their contents.

`table(data, properties?)` renders an ASCII table for arrays and objects, with
an optional array of property names. Other input values are logged normally.
Groups indent every line by two spaces per level. `groupCollapsed()` uses the
same text representation as `group()`. Counters start at one after creation or
reset.

**Behavior change:** `assert(true, ...)` no longer creates an entry or writes
output. Failed assertions are logged as errors and use `stderr` when configured,
matching native console behavior.

## **API**

```typescript
class Console {
  /**
   * @returns {typeof Console} Console Instance Class.
   */
  get Console();

  /**
   * @returns {Log[]} Console instance logs
   */
  get logs();

  /**
   * Creates a new Console instance.
   *
   * @typedef {Object} Options
   * @property {{ write(text: string): unknown, isTTY?: boolean } | boolean | null} [stdout] - Output stream. Defaults to system stdout.
   * @property {{ write(text: string): unknown, isTTY?: boolean } | boolean | null} [stderr] - Error stream. Defaults to stdout; true selects system stderr with default stdout.
   * @property {Function | boolean} [stdclear] - Stream clear callback. Defaults to system clear with default stdout.
   * @property {boolean} [time] - Whether to include the time in logs. Defaults to true.
   * @property {boolean | Colors} [colors] - Color override. Defaults to colors only for TTY destinations.
   * @property {boolean} [trace] - Whether to include the stack trace in logs. Defaults to the value of the `NODE_TRACE` environment variable.
   * @property {boolean} [debug] - Whether to enable debug mode. Defaults to the value of the `NODE_DEBUG` environment variable.
   * @property {number} [maxHistory] - Maximum retained entries; defaults to Infinity. Zero disables history.
   *
   * @param {Options} [options] - Optional configuration options.
   */
  constructor(options);

  /**
   * Announces a message.
   *
   * @param {...any} data - The message to announce.
   */
  announce(...data);

  /**
   * Asserts a condition.
   *
   * @param {boolean} condition - The condition to assert.
   * @param {...any} data - The message to log if the condition fails.
   */
  assert(condition, ...data);

  /**
   * Clears the console.
   */
  clear();

  /**
   * Waits for queued writes and redraws, rejecting on output failure.
   * @returns {Promise<void>}
   */
  flush();

  /**
   * Increments a counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  count(key = "");

  /**
   * Resets the counter for the given key.
   *
   * @param {string} [key] - The key of the counter.
   */
  countReset(key = "");

  /**
   * Logs a message.
   *
   * @param {...any} data - The message to log.
   */
  print(...data);

  /**
   * Logs a new line.
   */
  println();

  /**
   * Logs a debug message.
   *
   * @param {...any} data - The message to log.
   */
  debug(...data);

  /**
   * Logs an object.
   *
   * @param {Object} object - The object to log.
   */
  dir(object);

  /**
   * Logs an XML object.
   *
   * @param {Object} object - The XML object to log.
   */
  dirxml(object);

  /**
   * Logs an error message.
   *
   * @param {...any} data - The error message.
   */
  error(...data);

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  group(...data);

  /**
   * Starts a new group of logs.
   *
   * @param {...any} data - The message to log for the group header.
   */
  groupCollapsed(...data);

  /**
   * Ends a group of logs.
   */
  groupEnd();

  /**
   * Logs an information message.
   *
   * @param {...any} data - The message to log.
   */
  info(...data);

  /**
   * Logs a message.
   *
   * @param {...any} data - The success message.
   */
  log(...data);

  /**
   * Starts a profile measurement.
   *
   * @param {string} key - The key of the profile measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  profile(key, force);

  /**
   * Ends a profile measurement.
   *
   * @param {string} key - The key of the profile measurement.
   */
  profileEnd(key, print = true);

  /**
   * Logs a success message.
   *
   * @param {...any} data - The success message.
   */
  success(...data);

  /**
   * Logs a table.
   *
   * @param {Array<any>} data - The data to log as a table.
   * @param {string[]} [properties] - The object properties to include in the table.
   */
  table(data, properties);

  /**
   * Logs a time measurement start.
   *
   * @param {string} key - The key of the time measurement.
   * @param {boolean} [force] - Overwrites existing keys.
   */
  time(key, force = false);

  /**
   * Logs a time measurement end.
   *
   * @param {string} key - The key of the time measurement.
   * @param {boolean} print - Whether to print the time difference. Defaults to true.
   */
  timeEnd(key, print = true);

  /**
   * Logs a time measurement log.
   *
   * @param {string} key - The key of the time measurement.
   * @param {...any} data - The message to log.
   */
  timeLog(key, ...data);

  /**
   * Logs a timestamp.
   *
   * @param {string} key - The key of the time measurement.
   */
  timeStamp(key);

  /**
   * Logs a trace message.
   *
   * @param {...any} data - The message to log.
   */
  trace(...data);

  /**
   * Logs a warning message.
   *
   * @param {...any} data - The warning message.
   */
  warn(...data);
}

/**
 * Object containing ANSI escape codes for text formatting.
 */
const colors = {
  /**
   * @returns {string} Code to reset the console color.
   */
  reset,

  /**
   * @returns {string} Code to make the text bright.
   */
  bright,

  /**
   * @returns {string} Code to make the text dim.
   */
  dim,

  /**
   * @returns {string} Code to underline the text.
   */
  underscore,

  /**
   * @returns {string} Code to blink the text.
   */
  blink,

  /**
   * @returns {string} Code to reverse the text color.
   */
  reverse,

  /**
   * @returns {string} Code to set the text color to black.
   */
  black,

  /**
   * @returns {string} Code to set the text color to red.
   */
  red,

  /**
   * @returns {string} Code to set the text color to green.
   */
  green,

  /**
   * @returns {string} Code to set the text color to yellow.
   */
  yellow,

  /**
   * @returns {string} Code to set the text color to blue.
   */
  blue,

  /**
   * @returns {string} Code to set the text color to magenta.
   */
  magenta,

  /**
   * @returns {string} Code to set the text color to cyan.
   */
  cyan,

  /**
   * @returns {string} Code to set the text color to white.
   */
  white,
};
```

## **License**

Licensed under the GNU General Public License version 3 only (`GPL-3.0-only`). See [LICENSE](LICENSE) for the full terms.

## **Contributing**

Thank you for your interest in contributing to this project! Please ensure that any contributions respect the licensing terms specified. If you encounter any issues or have suggestions, feel free to report them. All issues will be well received and addressed to the best of our ability. We appreciate your support and contributions!

### **Authors**

- [Tiago Terenas Almeida](https://github.com/tiagomta)
