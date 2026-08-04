import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Enterprise Customer Management Unit Tests', () => {
  const sampleCustomers = [
    {
      id: 'c1',
      customerId: 'CUST-1001',
      fullName: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '+91 9876543210',
      city: 'Mumbai',
      state: 'Maharashtra',
      isVerified: true,
      status: 'active',
      isPremium: true,
      totalOrders: 42,
      totalSpending: 24850,
      walletBalance: 1250,
      rewardPoints: 850,
      registrationDate: '2024-01-15T10:30:00.000Z',
    },
    {
      id: 'c2',
      customerId: 'CUST-1002',
      fullName: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91 9876543211',
      city: 'Bengaluru',
      state: 'Karnataka',
      isVerified: true,
      status: 'active',
      isPremium: true,
      totalOrders: 89,
      totalSpending: 56400,
      walletBalance: 3400,
      rewardPoints: 2400,
      registrationDate: '2024-02-20T14:10:00.000Z',
    },
    {
      id: 'c3',
      customerId: 'CUST-1003',
      fullName: 'Rohan Verma',
      email: 'rohan@example.com',
      phone: '+91 9876543212',
      city: 'Delhi',
      state: 'Delhi',
      isVerified: false,
      status: 'blocked',
      isPremium: false,
      totalOrders: 14,
      totalSpending: 6800,
      walletBalance: 0,
      rewardPoints: 210,
      registrationDate: '2024-03-10T08:00:00.000Z',
    },
  ];

  it('correctly aggregates customer statistics KPIs', () => {
    const total = sampleCustomers.length;
    const active = sampleCustomers.filter((c) => c.status === 'active').length;
    const blocked = sampleCustomers.filter((c) => c.status === 'blocked').length;
    const verified = sampleCustomers.filter((c) => c.isVerified).length;
    const premium = sampleCustomers.filter((c) => c.isPremium).length;
    const totalRev = sampleCustomers.reduce((acc, c) => acc + c.totalSpending, 0);

    assert.equal(total, 3);
    assert.equal(active, 2);
    assert.equal(blocked, 1);
    assert.equal(verified, 2);
    assert.equal(premium, 2);
    assert.equal(totalRev, 88050);
  });

  it('filters customers by search query', () => {
    const search = 'aarav';
    const matches = sampleCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.customerId.toLowerCase().includes(search)
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, 'c1');
  });

  it('sorts customers by highest spending', () => {
    const sorted = [...sampleCustomers].sort((a, b) => b.totalSpending - a.totalSpending);
    assert.equal(sorted[0].id, 'c2'); // Priya: 56,400
    assert.equal(sorted[1].id, 'c1'); // Aarav: 24,850
    assert.equal(sorted[2].id, 'c3'); // Rohan: 6,800
  });

  it('handles bulk verification and status mutations', () => {
    const idsToBlock = ['c1', 'c2'];
    const updated = sampleCustomers.map((c) => ({
      ...c,
      status: idsToBlock.includes(c.id) ? 'blocked' : c.status,
    }));
    assert.equal(updated.filter((c) => c.status === 'blocked').length, 3);
  });
});
