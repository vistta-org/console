import * as COLORS from "../colors.js";
import { Console } from "../index.js";
import { toString as format } from "../modifiers/default.js";

suite("Console", () => {
  let logger;
  console.log("here");
  test("Constructor", () => {
    logger = new Console({ stdout: null });
    expect(!!logger).toEqual(true);
  });

  test("Colors", () => {
    expect(typeof COLORS.RESET).toEqual("string");
    expect(typeof COLORS.BRIGHT).toEqual("string");
    expect(typeof COLORS.DIM).toEqual("string");
    expect(typeof COLORS.UNDERSCORE).toEqual("string");
    expect(typeof COLORS.BLINK).toEqual("string");
    expect(typeof COLORS.REVERSE).toEqual("string");
    expect(typeof COLORS.BLACK).toEqual("string");
    expect(typeof COLORS.RED).toEqual("string");
    expect(typeof COLORS.GREEN).toEqual("string");
    expect(typeof COLORS.YELLOW).toEqual("string");
    expect(typeof COLORS.BLUE).toEqual("string");
    expect(typeof COLORS.MAGENTA).toEqual("string");
    expect(typeof COLORS.CYAN).toEqual("string");
    expect(typeof COLORS.WHITE).toEqual("string");
  });

  test("Announce", () => {
    const len = logger.logs.length;
    logger.announce(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Assert", () => {
    const len = logger.logs.length;
    logger.assert(true, "not logged");
    expect(logger.logs.length).toEqual(len);
    logger.assert(false, "failure");
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Clear", () => {
    logger.clear();
    expect(0).toEqual(logger.logs.length);
  });

  test("Count", () => {
    const len = logger.logs.length;
    logger.count("count");
    expect(len + 1).toEqual(logger.logs.length);
    logger.countReset("count");
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Println", () => {
    const len = logger.logs.length;
    logger.println();
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Print", () => {
    const len = logger.logs.length;
    logger.print(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Debug", () => {
    const len = logger.logs.length;
    logger.debug(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Dir", () => {
    const len = logger.logs.length;
    logger.dir({ key: "value" });
    expect(len + 1).toEqual(logger.logs.length);
    logger.dirxml({ key: "value" });
    expect(len + 2).toEqual(logger.logs.length);
  });

  test("Error", () => {
    const len = logger.logs.length;
    logger.error(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Group", () => {
    logger.group();
    logger.groupCollapsed();
    logger.groupEnd();
    expect(typeof logger.group).toEqual("function");
    expect(typeof logger.groupCollapsed).toEqual("function");
    expect(typeof logger.groupEnd).toEqual("function");
  });

  test("Info", () => {
    const len = logger.logs.length;
    logger.info(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Log", () => {
    const len = logger.logs.length;
    logger.log(len);
    expect(typeof logger.log).toEqual("function");
  });

  test("Success", () => {
    const len = logger.logs.length;
    logger.success(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Table", () => {
    const len = logger.logs.length;
    logger.table([{ key: "value" }]);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Time", () => {
    const len = logger.logs.length;
    logger.time("time1");
    expect(len).toEqual(logger.logs.length);
    logger.timeLog("time1");
    expect(len + 1).toEqual(logger.logs.length);
    logger.timeEnd("time1");
    expect(len + 2).toEqual(logger.logs.length);
    logger.time("time2");
    expect(len + 2).toEqual(logger.logs.length);
    logger.timeStamp("time2");
    expect(len + 3).toEqual(logger.logs.length);
    logger.timeEnd("time2", false);
    expect(len + 3).toEqual(logger.logs.length);
  });

  test("Trace", () => {
    const len = logger.logs.length;
    logger.trace(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Warn", () => {
    const len = logger.logs.length;
    logger.warn(len);
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Profile", () => {
    const len = logger.logs.length;
    logger.profile("profile");
    expect(len).toEqual(logger.logs.length);
    logger.profileEnd("profile");
    expect(len + 1).toEqual(logger.logs.length);
  });

  test("Shared output preserves order and logger formatting on replacement", () => {
    let text = "";
    const stream = { isTTY: true, write: (value) => (text += value) };
    const stdclear = () => (text = "");
    const first = new Console({ stdout: stream, stdclear, time: false, colors: false, trace: false, debug: false });
    const second = new Console({ stdout: stream, time: false, trace: false, debug: false });
    const entry = first.log("first");
    second.success("second");
    entry.replace("updated");
    expect(text).toEqual(`updated\n${COLORS.GREEN}second${COLORS.RESET}\n`);
    expect(first.logs.length).toEqual(1);
    expect(second.logs.length).toEqual(1);
    entry.remove();
    expect(text).toEqual(`${COLORS.GREEN}second${COLORS.RESET}\n`);
  });

  test("Clear preserves other loggers and invalidates old handles", () => {
    let text = "";
    let clears = 0;
    const stream = { isTTY: true, write: (value) => (text += value) };
    const stdclear = () => {
      clears++;
      text = "";
    };
    const options = { stdout: stream, stdclear, time: false, colors: false, trace: false, debug: false };
    const first = new Console(options);
    const second = new Console(options);
    const entry = first.log("first");
    second.log("second");
    first.clear();
    expect(text).toEqual("second\n");
    expect(first.logs.length).toEqual(0);
    expect(second.logs.length).toEqual(1);
    entry.replace("stale");
    entry.remove();
    expect(clears).toEqual(1);
    expect(text).toEqual("second\n");
  });

  test("Non-TTY streams stay plain and append-only", () => {
    let text = "";
    let clears = 0;
    const stream = { write: (value) => (text += value) };
    const logger = new Console({
      stdout: stream,
      stdclear: () => clears++,
      time: false,
      trace: false,
      debug: false,
    });
    const entry = logger.warn("warning");
    logger.assert(false, "condition");
    entry.replace("updated");
    expect(logger.logs[0].data[0]).toEqual("updated");
    entry.remove();
    logger.clear();
    expect(text).toEqual("warning\nAssertion failed condition\n");
    expect(clears).toEqual(0);
    expect(logger.logs.length).toEqual(0);
  });

  test("TTY streams without clear callbacks are not replayed", () => {
    let text = "";
    const stream = { isTTY: true, write: (value) => (text += value) };
    const logger = new Console({ stdout: stream, time: false, colors: false, trace: false, debug: false });
    logger.log("original").replace("updated");
    logger.clear();
    expect(text).toEqual("original\n");
  });

  test("Colors follow each destination and allow explicit overrides", () => {
    let out = "";
    let err = "";
    const stdout = { isTTY: true, write: (value) => (out += value) };
    const stderr = { isTTY: false, write: (value) => (err += value) };
    const logger = new Console({ stdout, stderr, time: false, trace: false });
    logger.success("success");
    logger.error("error");
    expect(out).toEqual(`${COLORS.GREEN}success${COLORS.RESET}\n`);
    expect(err).toEqual("error\n");
    new Console({ stdout: stderr, colors: true, time: false, trace: false }).warn("forced");
    expect(err).toEqual(`error\n${COLORS.YELLOW}forced${COLORS.RESET}\n`);
    new Console({ stdout, colors: false, time: false, trace: false }).warn("plain");
    expect(out).toEqual(`${COLORS.GREEN}success${COLORS.RESET}\nplain\n`);
  });

  test("Independent destinations are not cleared or replayed together", () => {
    let out = "";
    let err = "";
    const stdout = { isTTY: true, write: (value) => (out += value) };
    const stderr = { isTTY: true, write: (value) => (err += value) };
    const first = new Console({
      stdout,
      stdclear: () => (out = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    });
    const second = new Console({
      stdout: stderr,
      stdclear: () => (err = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    });
    first.log("out").replace("updated");
    second.log("err");
    first.clear();
    expect(out).toEqual("");
    expect(err).toEqual("err\n");
  });

  test("Replacement callbacks share rendering without adding helper output", () => {
    let text = "";
    const stream = { isTTY: true, write: (value) => (text += value) };
    const options = {
      stdout: stream,
      stdclear: () => (text = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    };
    const first = new Console(options);
    const second = new Console(options);
    const entry = first.log("original");
    second.log("second");
    entry.replace((logger) => logger.warn("updated"));
    expect(text).toEqual("updated\nsecond\n");
    expect(first.logs.length).toEqual(1);
  });

  test("Replacement callbacks preserve error routing and chronological order", () => {
    let out = "";
    let err = "";
    const stdout = { isTTY: true, write: (value) => (out += value) };
    const stderr = { isTTY: true, write: (value) => (err += value) };
    const first = new Console({
      stdout,
      stdclear: () => (out = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    });
    const second = new Console({
      stdout: stderr,
      stdclear: () => (err = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    });
    const logger = new Console({ stdout, stderr, time: false, colors: false, trace: false, debug: false });
    const entry = logger.log("original");
    first.log("later out");
    second.log("later err");
    entry.replace((actions) => actions.error("updated"));
    expect(out).toEqual("later out\n");
    expect(err).toEqual("updated\nlater err\n");
    entry.remove();
    expect(err).toEqual("later err\n");
  });

  test("Optional history limits evict only their logger and invalidate old handles", () => {
    let text = "";
    const stream = { isTTY: true, write: (value) => (text += value) };
    const options = {
      stdout: stream,
      stdclear: () => (text = ""),
      time: false,
      trace: false,
      colors: false,
      debug: false,
    };
    const first = new Console({ ...options, maxHistory: 2 });
    const second = new Console(options);
    const expired = first.log("expired");
    second.log("peer");
    first.log("retained");
    const latest = first.log("latest");
    expect(first.logs.length).toEqual(2);
    expect(first.logs[0].data[0]).toEqual("retained");
    latest.replace("updated");
    expect(text).toEqual("peer\nretained\nupdated\n");
    expired.replace("stale");
    expired.remove();
    expect(text).toEqual("peer\nretained\nupdated\n");
    first.clear();
    expect(text).toEqual("peer\n");
    expect(second.logs.length).toEqual(1);
  });

  test("Zero history still writes and invalid history limits throw", () => {
    let text = "";
    const logger = new Console({
      stdout: { write: (value) => (text += value) },
      maxHistory: 0,
      time: false,
      trace: false,
    });
    logger.log("written").replace("ignored");
    expect(text).toEqual("written\n");
    expect(logger.logs.length).toEqual(0);
    for (const maxHistory of [-1, 0.5, NaN, -Infinity])
      expect(() => new Console({ stdout: null, maxHistory })).toThrow("maxHistory");
  });

  test("Stack capture is opt-in and explicit trace preserves its call site", () => {
    const logger = new Console({ stdout: null, trace: false });
    logger.log("ordinary");
    logger.trace("explicit");
    logger.enable("trace");
    logger.log("enabled");
    expect(logger.logs[0].trace.length).toEqual(0);
    expect(logger.logs[1].trace.join("\n")).toInclude("index.test.js");
    expect(logger.logs[2].trace.join("\n")).toInclude("index.test.js");
    logger.disable("trace");
    logger.log("disabled");
    expect(logger.logs[3].trace.length).toEqual(0);
  });

  test("Formatting preserves repeated references and identifies actual cycles", () => {
    const shared = { number: 1n };
    const object = { first: shared, second: shared };
    object["self"] = object;
    const result = JSON.parse(format([object]));
    expect(result.first.number).toEqual("1n");
    expect(result.second.number).toEqual("1n");
    expect(result.self).toEqual("[Circular]");
    expect(format([2n, Symbol("symbol"), undefined, null])).toEqual("2n Symbol(symbol) undefined null");
  });

  test("Formatting includes errors, collections, and cycles through transformed objects", () => {
    const error = new Error("failure");
    error["cause"] = error;
    const map = new Map();
    map.set("self", map);
    const set = new Set([1n]);
    set.add(set);
    const result = JSON.parse(format([{ error, map, set }]));
    expect(result.error.message).toEqual("failure");
    expect(result.error.stack).toInclude("failure");
    expect(result.error.cause).toEqual("[Circular]");
    expect(result.map.type).toEqual("Map");
    expect(result.map.entries[0][1]).toEqual("[Circular]");
    expect(result.set.values[0]).toEqual("1n");
    expect(result.set.values[1]).toEqual("[Circular]");
  });

  test("Table output renders selected columns and primitive rows", () => {
    let text = "";
    const logger = new Console({ stdout: { write: (value) => (text += value) }, time: false, trace: false });
    logger.table([{ name: "Ada", hidden: true }, { name: "Lin" }], ["name"]);
    expect(text).toEqual(
      "+---------+------+\n| (index) | name |\n+---------+------+\n| 0       | Ada  |\n| 1       | Lin  |\n+---------+------+\n",
    );
    text = "";
    logger.table({ answer: 42, missing: null });
    expect(text).toInclude("| answer  | 42");
    expect(text).toInclude("| missing | null");
    expect(() => logger.table([], "name")).toThrow("array of strings");
    logger.table([]);
    logger.table("plain");
    expect(text).toInclude("plain\n");
  });

  test("Groups indent every line and counters start at one", () => {
    let text = "";
    const logger = new Console({ stdout: { write: (value) => (text += value) }, time: false, trace: false });
    logger.group("outer");
    logger.log("first\nsecond");
    logger.groupCollapsed("inner");
    logger.count("count");
    logger.countReset("count");
    logger.count("count");
    logger.groupEnd();
    logger.groupEnd();
    logger.groupEnd();
    logger.log("end");
    expect(text).toEqual("outer\n  first\n  second\n  inner\n    count: 1\n    count: 1\nend\n");
  });

  test("Assertions are silent on success and failures use stderr", () => {
    let out = "";
    let err = "";
    const logger = new Console({
      stdout: { write: (value) => (out += value) },
      stderr: { write: (value) => (err += value) },
      time: false,
      trace: false,
    });
    expect(logger.assert(true, "success")).toEqual(undefined);
    logger.assert(false, "failure");
    expect(out).toEqual("");
    expect(err).toEqual("Assertion failed failure\n");
    expect(logger.logs.length).toEqual(1);
  });

  test("Replacement callbacks retain mutations when returning nothing", () => {
    let text = "";
    const stream = { isTTY: true, write: (value) => (text += value) };
    const logger = new Console({
      stdout: stream,
      stdclear: () => (text = ""),
      time: false,
      trace: false,
      colors: false,
      debug: false,
    });
    const entry = logger.log("original");
    entry.replace((actions) => {
      actions.warn("updated");
    });
    expect(text).toEqual("updated\n");
    entry.replace((actions) => actions.assert(true, "ignored"));
    expect(text).toEqual("updated\n");
    entry.replace(() => "replacement");
    expect(text).toEqual("replacement\n");
  });

  test("Promise writers serialize shared loggers and flush waits for all writes", async () => {
    const written = [];
    const releases = [];
    const stream = {
      write: (text) => {
        written.push(text);
        return new Promise((resolve) => releases.push(resolve));
      },
    };
    const first = new Console({ stdout: stream, time: false, trace: false });
    const second = new Console({ stdout: stream, time: false, trace: false });
    first.log("first");
    second.log("second");
    expect(written.join("")).toEqual("first\n");
    let flushed = false;
    const flushing = second.flush().then(() => (flushed = true));
    expect(flushed).toEqual(false);
    releases.shift()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(written.join("")).toEqual("first\nsecond\n");
    expect(flushed).toEqual(false);
    releases.shift()();
    await flushing;
    expect(flushed).toEqual(true);
  });

  test("Web-style writers wait for readiness before writing", async () => {
    let ready;
    let text = "";
    const stream = {
      ready: new Promise((resolve) => (ready = resolve)),
      write: async (value) => {
        text += value;
      },
    };
    const logger = new Console({ stdout: stream, time: false, trace: false });
    logger.log("ready");
    expect(text).toEqual("");
    ready();
    await logger.flush();
    expect(text).toEqual("ready\n");
  });

  test("Node writable backpressure waits for callbacks and drain", async () => {
    const { Writable } = await import("node:stream");
    let text = "";
    const releases = [];
    const stream = new Writable({
      highWaterMark: 1,
      write(chunk, encoding, callback) {
        text += chunk.toString();
        releases.push(callback);
      },
    });
    const logger = new Console({ stdout: stream, time: false, trace: false });
    logger.log("first");
    logger.log("second");
    expect(text).toEqual("first\n");
    releases.shift()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(text).toEqual("first\nsecond\n");
    releases.shift()();
    await logger.flush();
    expect(stream.listenerCount("error")).toEqual(0);
    expect(stream.listenerCount("drain")).toEqual(0);
    stream.end();
  });

  test("Queued redraws keep write-time snapshots and preserve order", async () => {
    let text = "";
    const stream = {
      isTTY: true,
      write: async (value) => {
        text += value;
      },
    };
    const logger = new Console({
      stdout: stream,
      stdclear: () => (text = ""),
      time: false,
      colors: false,
      trace: false,
      debug: false,
    });
    const entry = logger.log("original");
    logger.log("second");
    entry.replace("updated");
    await logger.flush();
    expect(text).toEqual("updated\nsecond\n");
    entry.remove();
    await logger.flush();
    expect(text).toEqual("second\n");
  });

  test("Write failures throw synchronously or reject flush without continuing the queue", async () => {
    const failure = new Error("write failed");
    const sync = new Console({
      stdout: {
        write: () => {
          throw failure;
        },
      },
      time: false,
      trace: false,
    });
    expect(() => sync.log("failure")).toThrow("write failed");
    let caught;
    try {
      await sync.flush();
    } catch (error) {
      caught = error;
    }
    expect(caught).toEqual(failure);
    let calls = 0;
    const async = new Console({
      stdout: {
        write: () => {
          calls++;
          return Promise.reject(failure);
        },
      },
      time: false,
      trace: false,
    });
    async.log("first");
    async.log("not written");
    caught = undefined;
    try {
      await async.flush();
    } catch (error) {
      caught = error;
    }
    expect(caught).toEqual(failure);
    expect(calls).toEqual(1);
    expect(() => async.log("still failed")).toThrow("write failed");
  });

  test("Node write callback errors and premature closure reject flush", async () => {
    const { Writable } = await import("node:stream");
    const failure = new Error("node write failed");
    const stream = new Writable({
      write(chunk, encoding, callback) {
        callback(failure);
      },
    });
    const logger = new Console({ stdout: stream, time: false, trace: false });
    logger.log("failure");
    let caught;
    try {
      await logger.flush();
    } catch (error) {
      caught = error;
    }
    expect(caught).toEqual(failure);
    const closed = new Writable({ write() {} });
    const other = new Console({ stdout: closed, time: false, trace: false });
    other.log("closed");
    closed.destroy();
    caught = undefined;
    try {
      await other.flush();
    } catch (error) {
      caught = error;
    }
    expect(caught.message).toInclude("closed before");
  });

  test("Synchronous Node-style write failures clean up listeners and throw", async () => {
    const { EventEmitter } = await import("node:events");
    const failure = new Error("synchronous node failure");
    const stream = Object.assign(new EventEmitter(), {
      write: () => {
        throw failure;
      },
    });
    const logger = new Console({ stdout: stream, time: false, trace: false });
    expect(() => logger.log("failure")).toThrow("synchronous node failure");
    expect(stream.listenerCount("error")).toEqual(0);
    expect(stream.listenerCount("close")).toEqual(0);
    expect(stream.listenerCount("drain")).toEqual(0);
  });
});
