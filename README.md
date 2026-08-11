# Oshan Paudel Portfolio

A static developer portfolio that preserves the original Oshan.Codes visual design.

## Routes

- `/`
- `/about`
- `/projects`
- `/contact`
- `/guestbook`

## Deployment

The project is configured for Netlify.

1. Upload/push this folder to a Netlify site.
2. Netlify detects `netlify.toml`.
3. The guestbook function uses Netlify Blobs for persistent messages.
4. The contact form uses Netlify Forms.

No API keys are hardcoded.

## Local preview

Use the Netlify CLI for the complete local experience:

```bash
npm install
npx netlify dev
```

Opening the HTML files directly will show the pages, but serverless guestbook functionality requires the Netlify runtime.
