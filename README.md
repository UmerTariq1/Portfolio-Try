# Retro Windows Portfolio

This is the project implementation of my portfolio website. The entire desktop experience – login animation, Bliss wallpaper, draggable explorer windows, Start menu, taskbar clock, and context menu, is generated from a single YAML data file so it can be deployed as a static site (e.g., GitHub Pages).

## Project structure

```
index.html               # App shell and initial screens
assets/css/style.css     # Retro Windows theming and layout rules
assets/js/app.js         # Desktop runtime + lightweight YAML parser
assets/data/resume.yaml  # Primary source of truth for all portfolio content
assets/icons/            # Custom Windows-style SVG icons
assets/images/           # Wallpaper illustration
images/, resources/      # Media referenced from the YAML file
```

### YAML data contract

`assets/data/resume.yaml` is the only file you need to edit to refresh portfolio content. Each top-level key spawns both a desktop icon and a Start menu shortcut. The parser in `app.js` supports the following sections:

- `personal_info`: name, title, avatar path, and location.
- `contact`: key/value pairs that render as contact links (email/phone get automatic `mailto:`/`tel:` prefixes).
- `summary`: array of markdown-friendly paragraphs for the Summary window.
- `highlights`: quick bullet list of focus areas.
- `experience`, `projects`, `education`, `publications`: arrays of objects with nested lists (achievements, links, stacks, etc.).
- `skills`: grouped proficiencies; each group name becomes a heading and entries include `name`, `level` (1-5), and `proficiency` text.
- `photography`: toggleable gallery (`enabled: true/false`), description, and image metadata.
- `interests`: simple array of interests.

Feel free to add, remove, or rename sections – the desktop updates automatically as long as the YAML indentation is consistent.


## Features

- **Windows 7-style login screen** with glassmorphism effect, faux boot animation, and synthesized start-up sound
- **Authentic Aero-styled icons** with gradients and glossy effects for all sections
- **Fully functional desktop**:
  - Single-click to open desktop icons
  - Draggable, resizable, and scrollable explorer windows with proper size constraints
  - Window control buttons (minimize, maximize, close) work on all windows
  - Windows stay within screen bounds
- **Built-in applications**:
  - **Notepad** - functional text editor with resizable window
  - **Calculator** - working calculator with basic operations (+, -, *, /)
  - **Paint** - placeholder for future implementation
- **Enhanced taskbar**:
  - Polished Start button with hover effects
  - Live-updating clock with calendar popup
  - Window previews and taskbar buttons for all open windows
- **Start menu** with classic two-column layout, contact links, and Log Off action
- **Desktop context menu** (Refresh, Properties, Personalize)
- **Custom scrollbars** styled to match Windows 7 Aero theme
- **Lightweight JavaScript YAML parser** - zero external dependencies, works completely offline
- **Fully responsive** with graceful mobile degradation

## Customisation tips

- Replace the placeholder images inside `/images` with your actual photos/avatars while keeping the same filenames (or update the YAML paths).
- Update `resources/Resume_Umer_Butt.pdf` with your CV export to keep the Start menu shortcut valid.
- Edit or extend the YAML file to surface additional sections – icons and Start menu links are generated automatically.
- Customize the Aero-style icons in `assets/icons/` - they're all SVG files with gradient definitions.
- Adjust window sizes by modifying the `width` and `height` in `buildWindow()` function in `app.js`.
- Tweak the color scheme by modifying CSS custom properties in `style.css` (look for `:root`).

## Browser Compatibility

Works best in modern browsers (Chrome, Firefox, Safari, Edge). Features used:
- CSS Grid and Flexbox for layouts
- CSS custom properties (CSS variables)
- Modern ES6+ JavaScript (async/await, arrow functions, template literals)
- Web Audio API for startup sound