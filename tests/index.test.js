import { Console, colors } from "../index.js";

describe("Console", () => {
  let logger;
  it("Constructor", () => {
    logger = new Console({
      writer: new WritableStream({ write() { } }).getWriter(), clear() { },
    });
    assert.ok(!!logger);
  });

  it("Colors", () => {
    assert.equal(typeof colors.reset, "string");
    assert.equal(typeof colors.bright, "string");
    assert.equal(typeof colors.dim, "string");
    assert.equal(typeof colors.underscore, "string");
    assert.equal(typeof colors.blink, "string");
    assert.equal(typeof colors.reverse, "string");
    assert.equal(typeof colors.black, "string");
    assert.equal(typeof colors.red, "string");
    assert.equal(typeof colors.green, "string");
    assert.equal(typeof colors.yellow, "string");
    assert.equal(typeof colors.blue, "string");
    assert.equal(typeof colors.magenta, "string");
    assert.equal(typeof colors.cyan, "string");
    assert.equal(typeof colors.white, "string");
  });

  it("Announce", () => {
    const len = logger.logs.length;
    logger.announce(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Assert", () => {
    const len = logger.logs.length;
    logger.assert(typeof logger.assert, "function");
    assert.equal(len + 1, logger.logs.length);
  });

  it("Clear", () => {
    logger.clear();
    assert.equal(0, logger.logs.length);
  });

  it("Count", () => {
    const len = logger.logs.length;
    logger.count("count");
    assert.equal(len + 1, logger.logs.length);
    logger.countReset("count");
    assert.equal(len + 1, logger.logs.length);
  });

  it("Println", () => {
    const len = logger.logs.length;
    logger.println();
    assert.equal(len + 1, logger.logs.length);
  });

  it("Print", () => {
    const len = logger.logs.length;
    logger.print(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Debug", () => {
    const len = logger.logs.length;
    logger.debug(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Dir", () => {
    const len = logger.logs.length;
    logger.dir({ key: "value" });
    assert.equal(len + 1, logger.logs.length);
    logger.dirxml({ key: "value" });
    assert.equal(len + 2, logger.logs.length);
  });

  it("Error", () => {
    const len = logger.logs.length;
    logger.error(len);
    assert.equal(len + 1, logger.logs.length);
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
    const len = logger.logs.length;
    logger.info(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Log", () => {
    const len = logger.logs.length;
    logger.log(len);
    assert.equal(typeof logger.log, "function");
  });

  it("Success", () => {
    const len = logger.logs.length;
    logger.success(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Table", () => {
    const len = logger.logs.length;
    logger.table([{ key: "value" }]);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Time", () => {
    const len = logger.logs.length;
    logger.time("time1");
    assert.equal(len, logger.logs.length);
    logger.timeLog("time1");
    assert.equal(len + 1, logger.logs.length);
    logger.timeEnd("time1");
    assert.equal(len + 2, logger.logs.length);
    logger.time("time2");
    assert.equal(len + 2, logger.logs.length);
    logger.timeStamp("time2");
    assert.equal(len + 3, logger.logs.length);
    logger.timeEnd("time2", false);
    assert.equal(len + 3, logger.logs.length);
  });

  it("Trace", () => {
    const len = logger.logs.length;
    logger.trace(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Warn", () => {
    const len = logger.logs.length;
    logger.warn(len);
    assert.equal(len + 1, logger.logs.length);
  });

  it("Profile", () => {
    const len = logger.logs.length;
    logger.profile("profile");
    assert.equal(len, logger.logs.length);
    logger.profileEnd("profile");
    assert.equal(len + 1, logger.logs.length);
  });
});
