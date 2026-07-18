const { pool } = require('../config/db');

const aiEnabled = () =>
  String(process.env.AI_ASSISTANTS_ENABLED || '').toLowerCase() === 'true';

const parseVoiceTranscript = (transcript) => {
  const text = String(transcript || '').toLowerCase().trim();
  const intents = [];
  if (/add|order|want|get/.test(text)) {
    const qtyMatch = text.match(/(\d+)\s+(\w+)/);
    intents.push({
      type: 'add_item',
      quantity: qtyMatch ? Number(qtyMatch[1]) : 1,
      query: text.replace(/^(please\s+)?(add|order|want|get)\s+/i, '').trim(),
    });
  }
  if (/checkout|place order|confirm/.test(text)) {
    intents.push({ type: 'place_order' });
  }
  if (!intents.length) {
    intents.push({ type: 'unknown', query: text });
  }
  return { transcript: text, intents, enabled: aiEnabled() };
};

module.exports = { aiEnabled, parseVoiceTranscript };
