import themes from "@derekwinters/design-tokens/themes.json";
import { applyTheme } from "../src/utils/theme";
import "../src/index.css";

/**
 * Theme decorator — runs the exact runtime-theming path the app uses:
 * applyTheme() writes the palette's 9 slot vars plus the derived vars
 * (--text/--text-muted by background luminance, the --*-rgb tint triplets)
 * onto :root, exactly like App.jsx does after GET /theme/current.
 * index.css then paints the preview body with var(--bg).
 *
 * Applied synchronously during render so screenshots never race the theme.
 */
const withTheme = (storyFn, context) => {
  const palette = themes[context.globals.theme] ?? themes.dark;
  applyTheme(palette);
  document.documentElement.style.background = palette.bg;
  return storyFn();
};

export const globalTypes = {
  theme: {
    description: "Design-token palette (themes.json)",
    toolbar: {
      title: "Theme",
      icon: "paintbrush",
      // dark, light, charcoal, paper, pink, frog
      items: Object.keys(themes),
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  theme: "dark",
};

export const decorators = [withTheme];

export const parameters = {
  layout: "padded",
};
