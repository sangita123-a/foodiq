const dist = (a, b) => {
  const dx = Number(a.lat) - Number(b.lat);
  const dy = Number(a.lng) - Number(b.lng);
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Nearest-neighbor multi-stop route (foundation VRP heuristic).
 * stops: [{ id, lat, lng }]
 */
const optimizeRoute = ({ depot, stops = [] }) => {
  if (!depot || !stops.length) {
    return { order: [], total_distance: 0, algorithm: 'nearest_neighbor' };
  }
  const remaining = [...stops];
  const order = [];
  let current = depot;
  let total = 0;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((s, i) => {
      const d = dist(current, s);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    total += bestD;
    order.push(next);
    current = next;
  }
  total += dist(current, depot);
  return {
    order: order.map((s) => s.id),
    stops: order,
    total_distance: Math.round(total * 10000) / 10000,
    algorithm: 'nearest_neighbor',
  };
};

module.exports = { optimizeRoute, dist };
