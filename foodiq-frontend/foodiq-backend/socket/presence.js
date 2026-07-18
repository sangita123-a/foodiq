/**
 * In-memory presence for online delivery partners (admin live view).
 * Keyed by delivery_partner id when known, else user id.
 */
const onlineRiders = new Map();

const setRiderOnline = (key, meta = {}) => {
  onlineRiders.set(String(key), {
    ...meta,
    online_at: Date.now(),
    last_seen: Date.now(),
  });
};

const touchRider = (key, patch = {}) => {
  const prev = onlineRiders.get(String(key));
  if (!prev) return;
  onlineRiders.set(String(key), { ...prev, ...patch, last_seen: Date.now() });
};

const setRiderOffline = (key) => {
  onlineRiders.delete(String(key));
};

const listOnlineRiders = () =>
  Array.from(onlineRiders.entries()).map(([id, meta]) => ({ id, ...meta }));

const onlineRiderCount = () => onlineRiders.size;

module.exports = {
  setRiderOnline,
  touchRider,
  setRiderOffline,
  listOnlineRiders,
  onlineRiderCount,
};
