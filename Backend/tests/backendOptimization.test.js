import { test, describe } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";

import { responseCompression } from "../StaffCRM/middleware/compression.middleware.js";
import { getEncryptionKey } from "../StaffCRM/utils/encryption.utils.js";

// Models
import Attendance from "../StaffCRM/Attendance/attendance.model.js";
import WorkRecord from "../StaffCRM/Attendance/workRecord.model.js";
import Payroll from "../StaffCRM/Payroll/payroll.model.js";
import Task from "../StaffCRM/Tasks/task.model.js";
import ContentTask from "../StaffCRM/Tasks/ContentTask.model.js";
import Client from "../StaffCRM/Clients/Client.model.js";
import Todo from "../StaffCRM/Todo/todo.model.js";
import Invoice from "../Invoice/models/Invoice.model.js";

describe("Backend Optimization & Performance Guard Tests", () => {
  test("1. Native responseCompression compresses payloads >= 1KB when gzip accepted", () => {
    let capturedBody = null;
    let headers = {};

    const req = {
      method: "GET",
      headers: { "accept-encoding": "gzip, deflate, br" },
    };

    const res = {
      getHeader: (k) => headers[k],
      setHeader: (k, v) => {
        headers[k] = v;
      },
      removeHeader: (k) => {
        delete headers[k];
      },
      send: function (body) {
        capturedBody = body;
        return this;
      },
    };

    let nextCalled = false;
    responseCompression(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled, "Middleware calls next()");

    // Send a 5KB JSON payload
    const largePayload = JSON.stringify({
      data: new Array(100).fill({
        id: "emp-101",
        name: "Dev Employee",
        status: "PRESENT",
        punches: [{ in: "2026-11-05T04:30:00.000Z", out: "2026-11-05T13:00:00.000Z" }],
      }),
    });

    res.send(largePayload);

    assert.equal(headers["Content-Encoding"], "gzip");
    assert.equal(headers["Vary"], "Accept-Encoding");
    assert.ok(Buffer.isBuffer(capturedBody), "Compressed body is returned as a Buffer");
    assert.ok(
      capturedBody.length < largePayload.length,
      `Compressed size (${capturedBody.length}) is smaller than original (${largePayload.length})`
    );

    // Verify decompression restores original data
    const decompressed = zlib.gunzipSync(capturedBody).toString("utf8");
    assert.equal(decompressed, largePayload);
  });

  test("2. Native responseCompression ignores small payloads (< 1KB) to avoid CPU overhead", () => {
    let capturedBody = null;
    let headers = {};

    const req = {
      method: "GET",
      headers: { "accept-encoding": "gzip, deflate" },
    };

    const res = {
      getHeader: (k) => headers[k],
      setHeader: (k, v) => {
        headers[k] = v;
      },
      removeHeader: (k) => {
        delete headers[k];
      },
      send: function (body) {
        capturedBody = body;
        return this;
      },
    };

    responseCompression(req, res, () => {});

    const smallPayload = JSON.stringify({ success: true, message: "OK" });
    res.send(smallPayload);

    assert.equal(headers["Content-Encoding"], undefined, "Small payload is not gzip encoded");
    assert.equal(capturedBody, smallPayload, "Body is untouched string");
  });

  test("3. Schema Index Optimization verification across high-volume collections", () => {
    // Attendance indexes
    const attIndexes = Attendance.schema.indexes();
    assert.ok(
      attIndexes.some(([idx]) => idx.date === 1),
      "Attendance schema has index on { date: 1 }"
    );

    // WorkRecord indexes
    const wrIndexes = WorkRecord.schema.indexes();
    assert.ok(
      wrIndexes.some(([idx]) => idx.punchOut === 1 && idx.date === 1),
      "WorkRecord schema has index on { punchOut: 1, date: 1 }"
    );

    // Payroll indexes
    const payrollIndexes = Payroll.schema.indexes();
    assert.ok(
      payrollIndexes.some(([idx]) => idx.month === 1 && idx.year === 1),
      "Payroll schema has index on { month: 1, year: 1 }"
    );

    // Task indexes
    const taskIndexes = Task.schema.indexes();
    assert.ok(
      taskIndexes.some(([idx]) => idx.assignedTo === 1 && idx.status === 1),
      "Task schema has index on { assignedTo: 1, status: 1 }"
    );

    // ContentTask indexes
    const contentTaskIndexes = ContentTask.schema.indexes();
    assert.ok(
      contentTaskIndexes.some(([idx]) => idx.client === 1 && idx.publishDate === 1),
      "ContentTask schema has index on { client: 1, publishDate: 1 }"
    );

    // Client indexes
    const clientIndexes = Client.schema.indexes();
    assert.ok(
      clientIndexes.some(([idx]) => idx.email === 1),
      "Client schema has index on { email: 1 }"
    );

    // Todo indexes
    const todoIndexes = Todo.schema.indexes();
    assert.ok(
      todoIndexes.some(([idx]) => idx.user === 1 && idx.date === 1),
      "Todo schema has unique index on { user: 1, date: 1 }"
    );

    // Invoice indexes
    const invoiceIndexes = Invoice.schema.indexes();
    assert.ok(
      invoiceIndexes.some(([idx]) => idx.status === 1),
      "Invoice schema has index on { status: 1 }"
    );
  });

  test("4. Encryption key caching eliminates repeated hashing overhead", () => {
    const key1 = getEncryptionKey();
    const key2 = getEncryptionKey();
    assert.equal(key1, key2, "getEncryptionKey returns cached buffer instance");
    assert.equal(key1.length, 32, "Key is valid 256-bit buffer");
  });
});

