# Retro Windows Portfolio

This project renders **Umer Butt's** resume as an interactive Windows Vista/Windows 7 inspired desktop. The entire desktop experience – login animation, Bliss wallpaper, draggable explorer windows, Start menu, taskbar clock, and context menu – is generated from a single YAML data file so it can be deployed as a static site (e.g., GitHub Pages).

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

## Running locally

Because the site is static you only need a simple web server. From the project root run:

```bash
npx serve .
```

or, if you prefer Python’s built-in server:

```bash
python -m http.server 8000
```

Then open the provided URL (e.g. `http://localhost:3000` or `http://localhost:8000`). Any web server that can host static files will work.

## Deploying to GitHub Pages

This repository now ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the static assets to GitHub Pages whenever the `main` branch is updated. To deploy:

1. Create a new repository on GitHub (or use your existing portfolio repo) and set its default branch to `main`.
2. Add the GitHub remote and push the contents of this project:

   ```bash
   git remote add origin git@github.com:<your-user>/<your-repo>.git
   git push -u origin main
   ```

3. In the GitHub UI, navigate to **Settings → Pages** and ensure the “GitHub Actions” build and deployment source is enabled.
4. The `Deploy static site to GitHub Pages` workflow will run automatically on every push to `main`. When it succeeds, the `github-pages` environment will show the public URL.
5. Visit the URL to confirm the faux Windows desktop loads correctly.

If you would rather deploy manually, you can upload the project folder to the `gh-pages` branch or the classic `docs/` Pages source.

## Features

- Windows 7-style login screen with faux boot animation and synthesized start-up sound.
- Bliss-inspired wallpaper, hover highlights, and authentic icon styling.
- Draggable, resizable explorer windows for every YAML section (Projects, Experience, Skills, etc.).
- Taskbar with rounded Start button, live-updating clock, window previews, and tray icons.
- Start menu mirroring the classic two-column layout with contact links and a Log Off action.
- Desktop context menu (Refresh, Properties, Personalize) and a faux calendar popup.
- Lightweight JavaScript YAML parser to keep the site portable with zero dependencies.

## Customisation tips

- Replace the placeholder images inside `/images` with your actual photos/avatars while keeping the same filenames (or update the YAML paths).
- Update `resources/Resume_Umer_Butt.pdf` with your CV export to keep the Start menu shortcut valid.
- Edit or extend the YAML file to surface additional sections – icons and Start menu links are generated automatically.