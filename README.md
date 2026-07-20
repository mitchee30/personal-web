[README.md](https://github.com/user-attachments/files/30200843/README.md)
# personal-web

Wenbo Zhi's personal portfolio site — a single self-contained `index.html` with a dark theme and a hand-rolled Canvas 2D particle-network background (no external libraries, no CDN dependencies).

## Live site

Once GitHub Pages is enabled for this repo (Settings → Pages → Deploy from branch `main`, folder `/root`), it'll be live at:

```
https://mitchee30.github.io/personal-web/
```

## Sections

- **About** — background and interests in embedded systems, real-time software, and hardware
- **Skills** — languages, technologies, and developer tools
- **Experience** — Control Software Intern @ Sioux Technologies
- **Projects** — Midnight Sun Solar Race Car, DeployGuard CLI, Subscription Renewal Tracker
- **Education** — University of Waterloo, Honours Electrical Engineering (Co-op)
- **Contact** — email, GitHub, LinkedIn

## Tech

Plain HTML/CSS/JavaScript. The animated background is drawn on a `<canvas>` element with vanilla JS (no Three.js or other dependency), so the page loads and works offline with zero build step.

## Local preview

Just open `index.html` in a browser — no server or build tools required.

## Updating content

All content lives directly in `index.html`. Look for the section comments (`<!-- HERO -->`, `<!-- PROJECTS -->`, etc.) to find what to edit.
