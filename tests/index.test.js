import "../index.js";

describe("Console", () => {
  let _console;
  it("Constructor", () => {
    _console = new console.Console("_console");
    assert.ok(!!_console);
    assert.equal(console.constructor, _console.Console);
  });

  it("Static", () => {
    assert.equal(typeof _console.reset, "string");
    assert.equal(typeof _console.bright, "string");
    assert.equal(typeof _console.dim, "string");
    assert.equal(typeof _console.underscore, "string");
    assert.equal(typeof _console.blink, "string");
    assert.equal(typeof _console.reverse, "string");
    assert.equal(typeof _console.black, "string");
    assert.equal(typeof _console.red, "string");
    assert.equal(typeof _console.green, "string");
    assert.equal(typeof _console.yellow, "string");
    assert.equal(typeof _console.blue, "string");
    assert.equal(typeof _console.magenta, "string");
    assert.equal(typeof _console.cyan, "string");
    assert.equal(typeof _console.white, "string");
  });

  it("Announce", () => {
    _console.announce("test");
    assert.equal(typeof _console.announce, "function");
  });

  it("Assert", () => {
    _console.assert(typeof _console.assert, "function");
    assert.equal(typeof _console.assert, "function");
  });

  it("Clear", () => {
    _console.clear();
    assert.equal(typeof _console.clear, "function");
  });

  it("Count", () => {
    _console.count("test");
    _console.countReset("test");
    assert.equal(typeof _console.count, "function");
    assert.equal(typeof _console.countReset, "function");
  });

  it("Println", () => {
    _console.println();
    assert.equal(typeof _console.println, "function");
  });

  it("Print", () => {
    _console.print("test");
    assert.equal(typeof _console.print, "function");
  });

  it("Debug", () => {
    _console.debug("test");
    assert.equal(typeof _console.debug, "function");
  });

  it("Dir", () => {
    _console.dir({ 1: "test" });
    _console.dirxml({ 1: "test" });
    assert.equal(typeof _console.dir, "function");
    assert.equal(typeof _console.dirxml, "function");
  });

  it("Error", () => {
    _console.error("test");
    assert.equal(typeof _console.error, "function");
  });

  it("Group", () => {
    _console.group();
    _console.groupCollapsed();
    _console.groupEnd();
    assert.equal(typeof _console.group, "function");
    assert.equal(typeof _console.groupCollapsed, "function");
    assert.equal(typeof _console.groupEnd, "function");
  });

  it("Info", () => {
    _console.info("test");
    assert.equal(typeof _console.info, "function");
  });

  it("Log", () => {
    _console.log("test");
    assert.equal(typeof _console.log, "function");
  });

  it("Success", () => {
    _console.success("test");
    assert.equal(typeof _console.success, "function");
  });

  it("Table", () => {
    _console.table(["test"]);
    assert.equal(typeof _console.table, "function");
  });

  it("Time", () => {
    _console.time("test");
    _console.timeLog("test");
    _console.timeStamp("test");
    _console.timeEnd("test");
    assert.equal(typeof _console.time, "function");
    assert.equal(typeof _console.timeLog, "function");
    assert.equal(typeof _console.timeStamp, "function");
    assert.equal(typeof _console.timeEnd, "function");
  });

  it("Trace", () => {
    _console.trace("test");
    assert.equal(typeof _console.trace, "function");
  });

  it("Warn", () => {
    _console.warn("test");
    assert.equal(typeof _console.warn, "function");
  });

  it("Profile", () => {
    _console.profile("test");
    _console.profileEnd("test", true);
    assert.equal(typeof _console.profile, "function");
    assert.equal(typeof _console.profileEnd, "function");
  });
});
