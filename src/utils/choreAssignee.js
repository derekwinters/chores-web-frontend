export const UNASSIGNED_FILTER_VALUE = "unassigned";
export const UNASSIGNED_LABEL = "Unassigned";

export function getChoreAssigneeName(chore) {
  if (chore.assignment_type === "fixed") {
    return chore.assignee || chore.current_assignee || null;
  }

  return chore.current_assignee || null;
}

export function getChoreAssigneeLabel(chore) {
  return getChoreAssigneeName(chore) || UNASSIGNED_LABEL;
}

export function choreMatchesAssigneeFilter(chore, filterValue) {
  const assignee = getChoreAssigneeName(chore);

  if (filterValue === UNASSIGNED_FILTER_VALUE) {
    return assignee === null;
  }

  // Case 1: directly assigned to this user
  if (assignee === filterValue) return true;

  // Unassigned chores:
  if (assignee === null) {
    const eligible = chore.eligible_people;
    // Case 2: no eligible restriction — visible to all
    if (!eligible || eligible.length === 0) return true;
    // Case 3: user is in eligible list
    if (eligible.includes(filterValue)) return true;
    // Case 4: user is NOT in eligible list
    return false;
  }

  return false;
}
