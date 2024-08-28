# **VISTTA Console Library**

The `Console` object provides a set of methods for logging messages to the console. It allows for different log levels, formatting options, and time tracking.

## **Getting Started**

### **Install**

```sh
npm install @vistta/console
```

### **Usage**

```javascript
import "@vistta/console.js";

// Log a message
console.log("Hello, world!");

// Log an error
console.error("Something went wrong!");

// Log a warning
console.warn("Attention required!");

// Log a debug message
console.debug("This is a debug message.");

// Group messages
console.group("Group 1");
console.log("Message 1");
console.log("Message 2");
console.groupEnd();

// Time a function
console.time("function_name");
// Function code here
console.timeEnd("function_name");

// Time a function
const logger = new console.Console({ index: 1 });
logger.log("Index 1");
logger.log("Index 0");
```

## **API**

```typescript
class Console {
  /**
   * @returns {string} Code to reset the console color.
   */
  get reset();

  /**
   * @returns {string} Code to make the text bright.
   */
  get bright();

  /**
   * @returns {string} Code to make the text dim.
   */
  get dim();

  /**
   * @returns {string} Code to underline the text.
   */
  get underscore() {
    return typeof process === "undefined" ? "" : "\x1b[4m";
  }

  /**
   * @returns {string} Code to blink the text.
   */
  get blink();

  /**
   * @returns {string} Code to reverse the text color.
   */
  get reverse();

  /**
   * @returns {string} Code to set the text color to black.
   */
  get black();

  /**
   * @returns {string} Code to set the text color to red.
   */
  get red();

  /**
   * @returns {string} Code to set the text color to green.
   */
  get green();

  /**
   * @returns {string} Code to set the text color to yellow.
   */
  get yellow();

  /**
   * @returns {string} Code to set the text color to blue.
   */
  get blue();

  /**
   * @returns {string} Code to set the text color to magenta.
   */
  get magenta();

  /**
   * @returns {string} Code to set the text color to cyan.
   */
  get cyan();

  /**
   * @returns {string} Code to set the text color to white.
   */
  get white();

  /**
   * @returns {typeof Console} Console Instance Class.
   */
  get Console();

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
   * @param {boolean} [print] - Whether to print the time difference. Defaults to true.
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
   * @param {string} properties - The properties to include in the table header.
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
```

## **License**

Attribution-NonCommercial-NoDerivatives 4.0 International

## **Contributing**

Thank you for your interest in contributing to this project! Please ensure that any contributions respect the licensing terms specified. If you encounter any issues or have suggestions, feel free to report them. All issues will be well received and addressed to the best of our ability. We appreciate your support and contributions!

### **Authors**

- [Tiago Terenas Almeida](https://github.com/tiagomta)
