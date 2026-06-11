# 🧠 MindMap Journal

## 📌 Project Overview

MindMap Journal is a personal journaling app where your entries come to life as an **interactive mind map**. Each journal entry becomes a node on the canvas, colored by mood, and connected to a central hub. It also includes a traditional **Grid View** for browsing entries as cards.

This project demonstrates mastery of responsive frontend fundamentals — no frameworks, no libraries, just clean semantic code.

---

## ✨ Features

- 🕸 **Mind Map Canvas** — entries rendered as interactive nodes, drag to pan, scroll to zoom
- ⊞ **Grid View** — browse all entries as responsive cards
- 📝 **New Entry Modal** — add title, mood, body text, and tags
- 🎭 **8 Mood Types** — Joy, Calm, Sad, Angry, Anxious, Grateful, Inspired, Tired
- 🔍 **Search** — filter entries by title, body, or tags
- 🎨 **Mood Filter** — filter sidebar and canvas by mood
- 📊 **Stats Bar** — total entries, day streak, top mood, words written
- 💾 **LocalStorage** — entries persist across browser sessions
- ♿ **Accessible** — semantic HTML5, ARIA roles, keyboard navigation (Esc, Ctrl+N)
- 📱 **Fully Responsive** — mobile-first, works on all screen sizes

---

## 🗂 File Structure

```
project/
├── index.html      # Semantic HTML5 structure — all landmarks and UI
├── styles.css      # All styling — 2025 palette, typography, layout
├── app.js          # All JavaScript — state, canvas, interactions
└── README.md       # This file
```

No build tools, no dependencies, no configuration files needed.

---

### Colour Palette — 2025 Aesthetics

| Name | Hex | Meaning |
|------|-----|---------|
| Mocha Mousse | `#a5856f` | Stability — primary accent |
| Ethereal Blue | `#a0d4e0` | Trust — highlights & focus |
| Moonlit Grey | `#f2f0ea` | Refinement — text & surfaces |

### Typography

| Role | Font | Weights Used |
|------|------|-------------|
| Headlines | Montserrat | 700, 800 |
| Body / UI | Roboto | 400, 500 |

> Max 2 font families, 3 weights — per DecodeLabs spec.

---

### HTML5 — Semantic Landmarks
```
<header>      → Branding and navigation
<nav>         → Main navigation, view switcher
<aside>       → Sidebar — entry list and filters
<main>        → Core content — canvas and grid views
<section>     → Canvas view / Grid view panels
<article>     → Entry cards and modals
<footer>      → Site metadata
```

### CSS — Layout Strategy
- **CSS Grid** for the macro app shell (sidebar + main content)
- **Flexbox** for micro components (nav, mood picker, stats bar, form actions)
- **Mobile-First** breakpoints:
  - Base: single column (all screens)
  - `768px`: sidebar + main two-column grid
  - `1024px`: wider sidebar, auto-fill content grid

### JavaScript — State Management
- All state held in memory and synced to `localStorage`
- No frameworks — pure DOM manipulation
- Canvas rendered with the HTML5 `<canvas>` API
- Touch support for mobile pan and tap

---


## 🌱 Seed Data

On first load, the app populates 3 sample journal entries so the mind map isn't empty. These are defined in the `seedData()` function in `app.js`.

To customize the seed entries, edit the `seeds` array in `app.js`:

```js
const seeds = [
  {
    title: 'Your Entry Title',
    body:  'Your journal text here.',
    mood:  'inspired',   // joy | calm | sad | angry | anxious | grateful | inspired | tired
    tags:  ['tag1', 'tag2']
  },
  // add more...
];
```

> **Note:** Seed data only loads when `localStorage` is empty (first visit on a new browser/device). To reset, run `localStorage.removeItem('mmj_entries')` in the browser console and refresh.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Open new entry modal |
| `Escape` | Close any open modal |

---

## 📐 Responsive Behaviour

| Screen | Layout |
|--------|--------|
| Mobile `< 768px` | Single column, sidebar slides in from left via burger menu |
| Tablet `≥ 768px` | Sidebar fixed on left, main content on right |
| Desktop `≥ 1024px` | Wider sidebar, multi-column card grid |

---

## 🧱 Built With

- HTML5 — semantic structure and accessibility
- CSS3 — Grid, Flexbox, custom properties, media queries
- Vanilla JavaScript — Canvas API, LocalStorage, DOM events
- Google Fonts — Montserrat + Roboto


