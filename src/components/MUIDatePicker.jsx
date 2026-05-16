import React from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import dayjs from "dayjs";

// Get theme colors from CSS variables with fallbacks
const getThemeColors = () => {
  const root = document.documentElement;
  const getVar = (name, fallback) => {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  };

  return {
    surface: getVar("--surface", "#16202e"),
    surface2: getVar("--surface2", "#1e2d40"),
    border: getVar("--border", "#2c3f58"),
    text: getVar("--text", "#dce8f5"),
    textMuted: getVar("--text-muted", "#7899b8"),
    accent: getVar("--accent", "#73B1DD"),
    accentBtn: getVar("--accent-btn", "#3574B3"),
    accentBg: getVar("--accent-bg", "rgba(115,177,221,0.1)"),
  };
};

// Determine if current theme is light or dark based on background luminance
const getThemeMode = () => {
  const root = document.documentElement;
  const bgColor = getComputedStyle(root).getPropertyValue("--bg").trim() || "#080c14";

  // Parse hex color to RGB
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance using relative luminance formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use "light" mode for bright backgrounds, "dark" for dark backgrounds
  return luminance > 0.5 ? "light" : "dark";
};

const createCustomTheme = () => {
  const colors = getThemeColors();
  const mode = getThemeMode();

  return createTheme({
    palette: {
      mode,
      background: {
        default: colors.surface,
        paper: colors.surface,
      },
      primary: {
        main: colors.accent,
      },
      text: {
        primary: colors.text,
        secondary: colors.textMuted,
      },
    },
    components: {
      MuiPickersPopper: {
        styleOverrides: {
          root: {
            "& .MuiPaper-root": {
              backgroundColor: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            },
            "& .MuiIconButton-root": {
              color: colors.text,
            },
          },
        },
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            color: colors.text,
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            "& .MuiIconButton-root": {
              color: colors.text,
            },
            "& .MuiButtonBase-root": {
              color: colors.text,
            },
          },
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            color: colors.text,
            backgroundColor: "transparent",
            borderColor: "transparent",
            "&:hover": {
              backgroundColor: colors.surface2,
              borderColor: colors.border,
            },
            "&.Mui-selected": {
              backgroundColor: colors.accentBtn,
              color: colors.text,
              borderColor: colors.accentBtn,
              "&:hover": {
                backgroundColor: colors.accentBtn,
                borderColor: colors.accentBtn,
              },
            },
            "&.Mui-today": {
              borderColor: colors.accent,
              color: colors.text,
            },
          },
        },
      },
      MuiPickersMonth: {
        styleOverrides: {
          root: {
            color: colors.text,
            "&.Mui-selected": {
              backgroundColor: colors.accentBtn,
              color: colors.text,
            },
          },
        },
      },
      MuiPickersYear: {
        styleOverrides: {
          root: {
            color: colors.text,
            "&.Mui-selected": {
              backgroundColor: colors.accentBtn,
              color: colors.text,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              color: colors.text,
              backgroundColor: colors.surface,
              "& fieldset": {
                borderColor: colors.border,
              },
              "&:hover fieldset": {
                borderColor: colors.textMuted,
              },
              "&.Mui-focused fieldset": {
                borderColor: colors.accent,
              },
            },
            "& .MuiInputBase-input": {
              color: colors.text,
              caretColor: colors.text,
            },
          },
        },
      },
    },
  });
};

export default function MUIDatePicker({ initialDate, onSelect, onCancel }) {
  const [value, setValue] = React.useState(initialDate ? dayjs(initialDate) : null);
  const theme = createCustomTheme();

  const handleChange = (newValue) => {
    setValue(newValue);
    if (newValue) {
      const dateStr = newValue.format("YYYY-MM-DD");
      onSelect(dateStr);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          value={value}
          onChange={handleChange}
          format="YYYY-MM-DD"
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
