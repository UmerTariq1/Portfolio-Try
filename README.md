# Umer Butt - AI Engineer Portfolio

A modern, responsive portfolio website showcasing my experience as an AI Engineer specializing in NLP and Information Retrieval. Built as a single HTML file with embedded YAML data for easy maintenance.

## ✨ Features

- **Single File Architecture**: Complete portfolio in one `index.html` file
- **Responsive Design**: Beautiful layout that adapts to desktop, tablet, and mobile
- **YAML-Driven Content**: All resume data embedded as YAML for easy updates
- **Modern UI**: Clean, minimal design with smooth animations and transitions
- **Tab Navigation**: Organized sections for Summary, Experience, Projects, Skills, Education, and Publications
- **Mobile-First**: Off-canvas sidebar navigation for mobile devices
- **Accessible**: Built with accessibility best practices

## 🛠️ Technology Stack

- **HTML5**: Semantic markup and structure
- **Tailwind CSS**: Utility-first CSS framework via CDN
- **Vanilla JavaScript**: No frameworks, pure JS for functionality
- **js-yaml**: YAML parser for dynamic content rendering
- **Font Awesome**: Icon library for UI elements

## 📁 Project Structure

```
UmerTariq1.github.io/
├── index.html              # Main portfolio file
├── profile.yml             # Source resume data
├── images/                 # Profile and project images
│   ├── me.jpg             # Profile photo
│   ├── favicon.ico        # Site favicon
│   └── ...                # Other images
├── resources/              # Additional resources
│   └── Resume_Umer_Butt.pdf
└── README.md              # This file
```

## 🧭 Configuration & Recent Improvements

- **Social icons**: Uses Font Awesome via CDN. Links are rendered through the `buttonLink` helper in `index.html` which prepends icons, adds accessible labels, and ensures visible focus states. Footer now includes GitHub and LinkedIn links.
- **Sidebar order**: Controlled by a single `NAV_ITEMS` array in `index.html` (Tabs & Navigation section). The sidebar is generated from this array, and `TABS` is derived from it.
- **Skills progress bars**: Levels are defined in the embedded `RESUME_YAML` under `skills.items[].level` (0–5). The progress bars animate on first render and expose `role="progressbar"` with proper ARIA attributes.
- **Mobile sidebar toggle**: Visibility ensured by raising the mobile header z-index (now `z-50`). The button has appropriate ARIA attributes and keyboard focus styles.

## 🚀 Usage

### Viewing the Portfolio
1. Open `index.html` in any modern web browser
2. Navigate through sections using the sidebar tabs
3. On mobile, use the hamburger menu to access navigation

### Updating Content
1. Edit the `RESUME_YAML` string in `index.html` (lines 253-574)
2. Follow the YAML structure for:
   - Personal information (name, title, contact)
   - Work experience
   - Projects
   - Skills (with proficiency levels)
   - Education
   - Publications

### YAML Structure Example
```yaml
name: Your Name
title: Your Title
contact:
  email: your@email.com
  github: https://github.com/username
  linkedin: https://linkedin.com/in/username

experience:
  - company: Company Name
    role: Job Title
    start: Jan 2023
    end: Present
    summary: Brief description
    achievements:
      - Achievement 1
      - Achievement 2
    stack:
      - Technology 1
      - Technology 2
```

## 📄 Changes Log

See `docs/changes.md` for a concise summary of recent improvements and where to configure them.

## 🎨 Design Features

- **Color Scheme**: Monochromatic with accent green (#10b981)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Animations**: Subtle hover effects and smooth transitions
- **Cards**: Rounded corners and soft shadows for content sections
- **Responsive Grid**: Adaptive layouts for different screen sizes

## 📱 Responsive Behavior

- **Desktop (>1024px)**: Two-column layout with fixed sidebar
- **Tablet (768px-1024px)**: Single column with collapsible sidebar
- **Mobile (<768px)**: Single column with off-canvas navigation

## 🔧 Customization

### Colors
Modify the accent color in the Tailwind config (lines 17-28):
```javascript
accent: {
  500: '#10b981', // Main accent color
  // ... other shades
}
```

### Styling
- Update CSS classes in the HTML structure
- Modify Tailwind utilities for layout changes
- Adjust animation timing in the `<style>` section

### Content
- Add/remove sections by updating the `TABS` array (line 879)
- Modify renderer functions for different data structures
- Update navigation icons and labels

## 📄 Sections

1. **Summary**: Personal introduction with contact links
2. **Experience**: Work history with achievements and tech stack
3. **Projects**: Portfolio projects with technologies and links
4. **Skills**: Categorized skills with proficiency levels
5. **Education**: Academic background and achievements
6. **Publications**: Research papers and publications

## 🌟 Key Features

- **No Build Process**: Direct HTML file deployment
- **Self-Contained**: All dependencies via CDN
- **Fast Loading**: Minimal external resources
- **SEO Friendly**: Semantic HTML and meta tags
- **Print Ready**: Clean layout for PDF generation

## 📞 Contact

- **Email**: mumertbutt@gmail.com
- **LinkedIn**: [umertariq1](https://www.linkedin.com/in/umertariq1)
- **GitHub**: [UmerTariq1](https://github.com/UmerTariq1)
- **Website**: [umertariq1.github.io](https://umertariq1.github.io)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Tailwind CSS, YAML, and vanilla JavaScript.
