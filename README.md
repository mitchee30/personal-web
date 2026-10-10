# personal-web

Wenbo Zhi's portfolio. One painted sky over a lakeside town, and each page is a different time of day:

| Page | File | Sky |
|---|---|---|
| Home | `index.html` | dusk |
| About | `about.html` | afternoon |
| Experience | `experience.html` | sunset |
| Projects | `projects.html` | night, with a comet |
| Say hi | `contact.html` | dawn |

- **English / 中文**: the button in the top-right switches languages and the choice is remembered. Every piece of text is written twice, as `<span class="en">` and `<span class="zh">`.
- **Background music**: put the song at `assets/music/am.mp3`. Browsers only start audio after a click, so visitors press the record button. Pages switch in place, so the music keeps playing between pages.
- **No build step**: plain HTML, CSS and JavaScript. The sky, clouds, stars and shoreline are drawn in code, with no images.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from disk also works. Page links then do a normal reload, so the music restarts on every page.

## Files

```
index.html, about.html, experience.html, projects.html, contact.html
assets/style.css    colours for each sky, layout
assets/site.js      language, sky, stars and comet, scene, music, page switching
assets/music/       put am.mp3 here
```

## Live site

GitHub Pages: Settings → Pages → Deploy from branch `main`, folder `/root`.
