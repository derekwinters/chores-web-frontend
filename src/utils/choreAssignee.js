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
