import "../index.js";

describe("Console", () => {
  let logger;
  const logs = [];
  it("Constructor", () => {
    const write = (data) => logs.push(data);
    logger = new console.Console({
      stdout: { write }, stderr: { write }, clear: () => logs.length = 0,
    });
    assert.ok(!!logger);
    assert.equal(console.constructor, logger.Console);
  });

  it("Static", () => {
    assert.equal(typeof logger.reset, "string");
    assert.equal(typeof logger.bright, "string");
    assert.equal(typeof logger.dim, "string");
    assert.equal(typeof logger.underscore, "string");
    assert.equal(typeof logger.blink, "string");
    assert.equal(typeof logger.reverse, "string");
    assert.equal(typeof logger.black, "string");
    assert.equal(typeof logger.red, "string");
    assert.equal(typeof logger.green, "string");
    assert.equal(typeof logger.yellow, "string");
    assert.equal(typeof logger.blue, "string");
    assert.equal(typeof logger.magenta, "string");
    assert.equal(typeof logger.cyan, "string");
    assert.equal(typeof logger.white, "string");
  });

  it("Announce", () => {
    const len = logs.length;
    logger.announce(len);
    assert.equal(len + 1, logs.length);
  });

  it("Assert", () => {
    const len = logs.length;
    logger.assert(typeof logger.assert, "function");
    assert.equal(len + 1, logs.length);
  });

  it("Clear", () => {
    logger.clear();
    assert.equal(0, logs.length);
  });

  it("Count", () => {
    const len = logs.length;
    logger.count("count");
    assert.equal(len + 1, logs.length);
    logger.countReset("count");
    assert.equal(len + 1, logs.length);
  });

  it("Println", () => {
    const len = logs.length;
    logger.println();
    assert.equal(len + 1, logs.length);
  });

  it("Print", () => {
    const len = logs.length;
    logger.print(len);
    assert.equal(len + 1, logs.length);
  });

  it("Debug", () => {
    const len = logs.length;
    logger.debug(len);
    assert.equal(len + 1, logs.length);
  });

  it("Dir", () => {
    const len = logs.length;
    logger.dir({ logs });
    assert.equal(len + 1, logs.length);
    logger.dirxml({ logs });
    assert.equal(len + 2, logs.length);
  });

  it("Error", () => {
    const len = logs.length;
    logger.error(len);
    assert.equal(len + 1, logs.length);
  });

  it("Group", () => {
    logger.group();
    logger.groupCollapsed();
    logger.groupEnd();
    assert.equal(typeof logger.group, "function");
    assert.equal(typeof logger.groupCollapsed, "function");
    assert.equal(typeof logger.groupEnd, "function");
  });

  it("Info", () => {
    const len = logs.length;
    logger.info(len);
    assert.equal(len + 1, logs.length);
  });

  it("Log", () => {
    const len = logs.length;
    logger.log(len);
    assert.equal(typeof logger.log, "function");
  });

  it("Success", () => {
    const len = logs.length;
    logger.success(len);
    assert.equal(len + 1, logs.length);
  });

  it("Table", () => {
    const len = logs.length;
    logger.table(logs);
    assert.equal(len + 1, logs.length);
  });

  it("Time", () => {
    const len = logs.length;
    logger.time("time1");
    assert.equal(len, logs.length);
    logger.timeLog("time1");
    assert.equal(len + 1, logs.length);
    logger.timeEnd("time1");
    assert.equal(len + 2, logs.length);
    logger.time("time2");
    assert.equal(len + 2, logs.length);
    logger.timeStamp("time2");
    assert.equal(len + 3, logs.length);
    logger.timeEnd("time2", false);
    assert.equal(len + 3, logs.length);
  });

  it("Trace", () => {
    const len = logs.length;
    logger.trace(len);
    assert.equal(len + 1, logs.length);
  });

  it("Warn", () => {
    const len = logs.length;
    logger.warn(len);
    assert.equal(len + 1, logs.length);
  });

  it("Profile", () => {
    const len = logs.length;
    logger.profile("profile");
    assert.equal(len, logs.length);
    logger.profileEnd("profile");
    assert.equal(len + 1, logs.length);
  });
});
