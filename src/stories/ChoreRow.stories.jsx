import React, { useEffect, useRef } from "react";
import ChoreCard from "../components/ChoreCard";

// The flagship shared component (mapping matrix "Chore row"): accent bar
// 4px — due → error, complete → text-muted; collapsed grid layout matches
// the Android ChoreListScreen. Pairs with the Android golden
// chorerow_list_<theme>.png (one expanded + collapsed rows).

export default {
  title: "ChoreRow",
};

const noop = () => {};

/** ChoreCard keeps expanded state internal — click it once after mount. */
function AutoExpand({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector(".chore-card")?.click();
  }, []);
  return <div ref={ref}>{children}</div>;
}

const dueChore = { name: "Take out trash", age: 1, next_due: "2026-07-09", points: 5 };
const doneChore = { name: "Dishes", age: 0, next_due: "2026-07-11", points: 2 };
const futureChore = { name: "Water plants", age: -3, next_due: "2026-07-13", points: 3 };

export const List = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        maxWidth: 640,
      }}
    >
      <AutoExpand>
        <ChoreCard
          chore={dueChore}
          choreState="due"
          status="Due"
          frequency="Weekly"
          assignee="Derek"
          onComplete={noop}
          onSkip={noop}
          onEdit={noop}
          onHistory={noop}
          onDelete={noop}
        />
      </AutoExpand>
      <ChoreCard chore={dueChore} choreState="due" assignee="Derek" />
      <ChoreCard chore={doneChore} choreState="complete" assignee="Alice" />
      <ChoreCard chore={futureChore} choreState="waiting" assignee="Alice" />
      <AutoExpand>
        <ChoreCard
          chore={doneChore}
          choreState="complete"
          status="Complete"
          frequency="Daily"
          assignee="Alice"
          onMarkDue={noop}
          onEdit={noop}
          onHistory={noop}
          onDelete={noop}
        />
      </AutoExpand>
    </div>
  ),
};
