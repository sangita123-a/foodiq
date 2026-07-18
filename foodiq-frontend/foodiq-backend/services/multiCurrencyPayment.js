const { getCheckoutCurrency, convertAmount } = require('./currencyService');

const multiCurrencyEnabled = () =>
  String(process.env.MULTI_CURRENCY_PAYMENTS || '').toLowerCase() === 'true';

/**
 * Resolve payment currency + amount for Razorpay.
 * When MULTI_CURRENCY_PAYMENTS is off, always INR with amount unchanged.
 */
const resolvePaymentAmount = async ({ amountInr, marketId, targetCurrency }) => {
  const base = Number(amountInr) || 0;
  if (!multiCurrencyEnabled()) {
    return {
      enabled: false,
      currency: 'INR',
      amount: base,
      amount_minor: Math.round(base * 100),
    };
  }
  const currency =
    targetCurrency || (await getCheckoutCurrency(marketId)) || 'INR';
  const converted = await convertAmount(base, 'INR', currency);
  return {
    enabled: true,
    currency,
    amount: converted,
    amount_minor: Math.round(converted * 100),
  };
};

module.exports = { multiCurrencyEnabled, resolvePaymentAmount };
