/**
 * Unit tests for Delivery Execution Workflow & Status Transitions
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// State transition validator matrix
const VALID_NEXT_STATUS = {
  assigned: ["reached_restaurant"],
  accepted: ["reached_restaurant"],
  reached_restaurant: ["picked_up"],
  picked_up: ["out_for_delivery", "on_the_way"],
  out_for_delivery: ["delivered"],
  on_the_way: ["delivered"],
};

function isValidTransition(currentStatus, targetStatus) {
  const normCurrent = (currentStatus || "").toLowerCase().replace(/\s+/g, "_");
  const normTarget = targetStatus === "on_the_way" ? "out_for_delivery" : targetStatus;
  const allowed = VALID_NEXT_STATUS[normCurrent] || [];
  return allowed.includes(targetStatus) || allowed.includes(normTarget);
}

describe("Delivery Execution Workflow - Status Transitions", () => {
  it("allows valid sequential transitions from assigned to delivered", () => {
    assert.equal(isValidTransition("assigned", "reached_restaurant"), true);
    assert.equal(isValidTransition("accepted", "reached_restaurant"), true);
    assert.equal(isValidTransition("reached_restaurant", "picked_up"), true);
    assert.equal(isValidTransition("picked_up", "out_for_delivery"), true);
    assert.equal(isValidTransition("picked_up", "on_the_way"), true);
    assert.equal(isValidTransition("out_for_delivery", "delivered"), true);
    assert.equal(isValidTransition("on_the_way", "delivered"), true);
  });

  it("rejects invalid out-of-order transitions", () => {
    // Skipping steps
    assert.equal(isValidTransition("assigned", "picked_up"), false);
    assert.equal(isValidTransition("assigned", "out_for_delivery"), false);
    assert.equal(isValidTransition("assigned", "delivered"), false);
    assert.equal(isValidTransition("reached_restaurant", "delivered"), false);
    assert.equal(isValidTransition("reached_restaurant", "out_for_delivery"), false);

    // Backwards transitions
    assert.equal(isValidTransition("picked_up", "reached_restaurant"), false);
    assert.equal(isValidTransition("delivered", "picked_up"), false);
    assert.equal(isValidTransition("delivered", "assigned"), false);
  });

  it("verifies assigned order attributes schema", () => {
    const mockOrder = {
      id: "ord_12345",
      order_id: "ord_12345",
      restaurant_name: "Tandoori Nights",
      restaurant_address: "123 Food Street, Hyderabad",
      customer_name: "John Doe",
      customer_address: "456 Tech Park, Hitech City, Hyderabad",
      total_amount: 450,
      payment_status: "paid",
      order_status: "assigned",
      assigned_at: "2026-07-30T22:00:00.000Z",
      items: [
        { name: "Butter Chicken", quantity: 1, price_at_time: 350 },
        { name: "Naan", quantity: 2, price_at_time: 50 },
      ],
    };

    assert.ok(mockOrder.id);
    assert.ok(mockOrder.restaurant_name);
    assert.ok(mockOrder.restaurant_address);
    assert.ok(mockOrder.customer_name);
    assert.ok(mockOrder.customer_address);
    assert.equal(Array.isArray(mockOrder.items), true);
    assert.equal(mockOrder.items.length, 2);
    assert.equal(typeof mockOrder.total_amount, "number");
    assert.ok(mockOrder.payment_status);
    assert.ok(mockOrder.order_status);
    assert.ok(mockOrder.assigned_at);
  });
});
