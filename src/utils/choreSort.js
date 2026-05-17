const STATE_ORDER = { due: 0, complete: 1 };

function getStateOrder(state) {
  return STATE_ORDER[state] ?? 0;
}

function getNextDueTimestamp(nextDue) {
  if (!nextDue) return Number.POSITIVE_INFINITY;

  const timestamp = Date.parse(`${nextDue}T00:00:00`);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function compareChoresByNextDue(a, b) {
  const stateDiff = getStateOrder(a.state) - getStateOrder(b.state);
  if (stateDiff !== 0) return stateDiff;

  const dueDiff = getNextDueTimestamp(a.next_due) - getNextDueTimestamp(b.next_due);
  if (dueDiff !== 0) return dueDiff;

  return a.name.localeCompare(b.name);
}
