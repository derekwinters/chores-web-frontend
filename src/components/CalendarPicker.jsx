import React, { useState } from "react";
import "./CalendarPicker.css";

export default function CalendarPicker({ initialDate, onSelect, onCancel }) {
  const [date, setDate] = useState(initialDate ? new Date(initialDate + "T00:00:00") : new Date());

  const year = date.getFullYear();
  const month = date.getMonth();

  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selected = date.getDate();
  const selectedMonth = date.getMonth();
  const selectedYear = date.getFullYear();

  const handleDateClick = (day) => {
    const newDate = new Date(year, month, day);
    const dateStr = newDate.toISOString().split("T")[0];
    onSelect(dateStr);
  };

  const handlePrevMonth = () => {
    setDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setDate(new Date());
  };

  return (
    <div className="calendar-picker">
      <div className="calendar-header">
        <button type="button" className="nav-btn" onClick={handlePrevMonth}>
          ◀
        </button>
        <div className="month-year">{monthName}</div>
        <button type="button" className="nav-btn" onClick={handleNextMonth}>
          ▶
        </button>
      </div>

      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, idx) => (
          <button
            key={idx}
            type="button"
            className={`calendar-day ${day === null ? "empty" : ""} ${
              day && day === selected && year === selectedYear && month === selectedMonth ? "selected" : ""
            }`}
            onClick={() => day !== null && handleDateClick(day)}
            disabled={day === null}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="calendar-actions">
        <button type="button" className="btn-secondary btn-sm" onClick={handleToday}>
          Today
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
