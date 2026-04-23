function getNextDueTimestamp(nextDue) {
  if (!nextDue) return Number.POSITIVE_INFINITY;

  const timestamp = Date.parse(`${nextDue}T00:00:00`);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function compareChoresByNextDue(a, b) {
  const dueDiff = getNextDueTimestamp(a.next_due) - getNextDueTimestamp(b.next_due);
  if (dueDiff !== 0) return dueDiff;

  return a.name.localeCompare(b.name);
}
