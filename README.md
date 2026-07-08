# Live Portfolio CV + Google Sheets Mini CMS

This portfolio is designed for Vercel, Netlify, or GitHub Pages.

It has two content modes:

## Mode 1 — Quick launch with local content

Edit `content.json`, then deploy.

Files:
- `index.html`
- `style.css`
- `app.js`
- `config.js`
- `content.json`

## Mode 2 — Editable CMS with Google Sheets

Use Google Sheets as a mini CMS so you can update your portfolio without editing code.

### Step 1 — Create a Google Sheet

Create tabs with these exact names:

1. profile
2. metrics
3. roleFit
4. capabilities
5. projects
6. experience
7. skills
8. certifications
9. links

### Step 2 — Add headers

Use these headers:

#### profile
name | title | tagline | headline | summary | contactHeadline | contactText

#### metrics
label | value | description

#### roleFit
title | description

#### capabilities
label | value

Value should be a number from 0 to 100.

#### projects
tag | title | description | tools

For tools, separate values with comma:
Data Quality, POI Validation, Classification Logic

#### experience
period | role | company | bullets

For bullets, separate values with this symbol:
|

Example:
Analyzed POI data.|Prepared reports.|Collaborated with Product and Engineering.

#### skills
category | items

#### certifications
name | issuer | date | credential

#### links
label | url

### Step 3 — Add Apps Script

Open:
Extensions → Apps Script

Paste the code from:
`google-apps-script.js`

Deploy:
Deploy → New deployment → Web app

Settings:
- Execute as: Me
- Who has access: Anyone

Copy the Web App URL.

### Step 4 — Connect website to Sheet

Open `config.js` and paste the URL:

```js
window.CMS_URL = "https://script.google.com/macros/s/XXXX/exec";
```

Deploy again.

## Deployment options

### Vercel
Best for tech/product impression.

1. Create GitHub repo.
2. Upload files.
3. Import repo to Vercel.
4. Deploy.

### Netlify Drop
Fastest if you want immediate launch.

1. Go to Netlify Drop.
2. Drag the folder.
3. Done.

### GitHub Pages
Good if you want a free public portfolio.

1. Create public repo.
2. Upload files.
3. Settings → Pages → Deploy from branch.

## Notes

- This is intentionally not dependent on frameworks like React/Next.js.
- It is lightweight, fast, and easy to edit.
- It already includes visual elements: orbit diagram, role switcher, capability chart, metrics, timeline, project cards, and reveal animation.


## New in this version

- More general positioning, not tied to one company.
- Experience section now shows top 3 highlights by default.
- Button: "See more experience" reveals older experience.
- Useful for multiple applications across Data Analyst, Location Intelligence, Product/Data Operations, AI-assisted workflow, and Web-adjacent roles.


## Mobile story upgrade

This version improves engagement on mobile:
- Adds a Quick Scan section for fast recruiter reading.
- Adds a Proof Map to translate experience into digital/product value.
- Adds a second visual chart: Role Evidence Map.
- Converts project details into expandable case-study sections.
- Shows fewer experience items on mobile by default.
- Keeps the page general enough for multiple applications, not only one company.


## Soft gray premium update

- Softer gray-first visual direction.
- More elegant copywriting, less direct/recruiter-facing.
- Added premium supergraphic layers.
- Skills show 3 items by default with "See more skills".
- Recent learning track shows 3 items by default with "See more learning".
- Better suited for multiple job applications, not only one company.
