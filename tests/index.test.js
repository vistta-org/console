import { Console } from "../index.js";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Console", () => {
  let debug;
  it("Constructor", () => {
    debug = new Console("debug");
    assert.ok(!!debug);
    assert.equal(Console, debug.Console);
  });

  it("Static", () => {
    assert.equal(typeof Console.reset, "string");
    assert.equal(typeof Console.bright, "string");
    assert.equal(typeof Console.dim, "string");
    assert.equal(typeof Console.underscore, "string");
    assert.equal(typeof Console.blink, "string");
    assert.equal(typeof Console.reverse, "string");
    assert.equal(typeof Console.black, "string");
    assert.equal(typeof Console.red, "string");
    assert.equal(typeof Console.green, "string");
    assert.equal(typeof Console.yellow, "string");
    assert.equal(typeof Console.blue, "string");
    assert.equal(typeof Console.magenta, "string");
    assert.equal(typeof Console.cyan, "string");
    assert.equal(typeof Console.white, "string");
  });

  it("Announce", () => {
    debug.announce("test");
    assert.equal(typeof debug.announce, "function");
  });

  it("Assert", () => {
    debug.assert(typeof debug.assert, "function");
    assert.equal(typeof debug.assert, "function");
  });

  it("Clear", () => {
    debug.clear();
    assert.equal(typeof debug.clear, "function");
  });

  it("Count", () => {
    debug.count("test");
    debug.countReset("test");
    assert.equal(typeof debug.count, "function");
    assert.equal(typeof debug.countReset, "function");
  });

  it("Println", () => {
    debug.println();
    assert.equal(typeof debug.println, "function");
  });

  it("Print", () => {
    debug.print("test");
    assert.equal(typeof debug.print, "function");
  });

  it("Debug", () => {
    debug.debug("test");
    assert.equal(typeof debug.debug, "function");
  });

  it("Dir", () => {
    debug.dir({ 1: "test" });
    debug.dirxml({ 1: "test" });
    assert.equal(typeof debug.dir, "function");
    assert.equal(typeof debug.dirxml, "function");
  });

  it("Debug", () => {
    debug.debug("test");
    assert.equal(typeof debug.debug, "function");
  });

  it("Error", () => {
    debug.error("test");
    assert.equal(typeof debug.error, "function");
  });

  it("Group", () => {
    debug.group();
    debug.groupCollapsed();
    debug.groupEnd();
    assert.equal(typeof debug.group, "function");
    assert.equal(typeof debug.groupCollapsed, "function");
    assert.equal(typeof debug.groupEnd, "function");
  });

  it("Info", () => {
    debug.info("test");
    assert.equal(typeof debug.info, "function");
  });

  it("Log", () => {
    debug.log("test");
    assert.equal(typeof debug.log, "function");
  });

  it("Success", () => {
    debug.success("test");
    assert.equal(typeof debug.success, "function");
  });

  it("Table", () => {
    debug.table(["test"]);
    assert.equal(typeof debug.table, "function");
  });

  it("Time", () => {
    debug.time("test");
    debug.timeLog("test");
    debug.timeStamp("test");
    debug.timeEnd("test");
    assert.equal(typeof debug.time, "function");
    assert.equal(typeof debug.timeLog, "function");
    assert.equal(typeof debug.timeStamp, "function");
    assert.equal(typeof debug.timeEnd, "function");
  });

  it("Trace", () => {
    debug.trace("test");
    assert.equal(typeof debug.trace, "function");
  });

  it("Warn", () => {
    debug.warn("test");
    assert.equal(typeof debug.warn, "function");
  });

  it("Profile", () => {
    debug.profile("test");
    debug.profileEnd("test", true);
    assert.equal(typeof debug.profile, "function");
    assert.equal(typeof debug.profileEnd, "function");
  });
});
