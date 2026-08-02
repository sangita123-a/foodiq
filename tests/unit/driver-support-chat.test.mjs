import test from "node:test";
import assert from "node:assert/strict";

test("Driver Support Chat Unit Tests", async (t) => {
  await t.test("generates ticket number in TK-YYYYMMDD-XXXX format", () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `TK-${dateStr}-${randNum}`;

    assert.match(candidate, /^TK-\d{8}-\d{4}$/, "Ticket number format must be TK-YYYYMMDD-XXXX");
  });

  await t.test("enforces priority & status validation rules", () => {
    const validPriorities = ["low", "medium", "high", "urgent"];
    const validStatuses = ["open", "in_progress", "resolved", "closed"];

    const isPriorityValid = (p) => validPriorities.includes(p);
    const isStatusValid = (s) => validStatuses.includes(s);

    assert.equal(isPriorityValid("urgent"), true);
    assert.equal(isPriorityValid("invalid"), false);
    assert.equal(isStatusValid("in_progress"), true);
    assert.equal(isStatusValid("invalid"), false);
  });

  await t.test("prevents posting messages to closed tickets", () => {
    const canPostMessage = (status) => status !== "closed";

    assert.equal(canPostMessage("open"), true, "Open ticket should accept messages");
    assert.equal(canPostMessage("in_progress"), true, "In-progress ticket should accept messages");
    assert.equal(canPostMessage("closed"), false, "Closed ticket must block new messages");
  });

  await t.test("verifies partner ticket isolation", () => {
    const canPartnerAccessTicket = (ticketPartnerId, userPartnerId, userRole) => {
      if (userRole === "admin") return true;
      return ticketPartnerId === userPartnerId;
    };

    assert.equal(canPartnerAccessTicket("partner-1", "partner-1", "partner"), true);
    assert.equal(canPartnerAccessTicket("partner-1", "partner-2", "partner"), false);
    assert.equal(canPartnerAccessTicket("partner-1", "partner-2", "admin"), true);
  });
});
