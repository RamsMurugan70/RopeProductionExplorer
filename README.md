# PPC Reports

Rope Production Explorer and PPC Sales Dashboard, with one shared set of published figures.

No business data is kept in this repository. The pages start empty, and the figures come from what the publisher publishes.

## Using the live site

- **Viewers** open https://ropeproductionexplorer.netlify.app/ on a phone or laptop. They can see, filter and export, but cannot change anything.
- **The publisher** opens the same link with `?publisher` added to a report, such as `/explorer.html?publisher` or `/dashboard.html?publisher`, and enters the publisher key once on each computer and browser.

## Publishing new figures

1. Open a report in publisher mode. The yellow strip at the top shows the state of the figures.
2. Upload the Excel file from your computer, or edit invoices. These changes are a draft that only you can see.
3. Check the figures and any notes shown under the upload buttons.
4. Press **Publish**. Everyone who opens or reloads the report now sees the new figures.

To drop a draft, use **Discard unpublished changes** in the Explorer or **Discard changes** in the Dashboard.

Sales figures are shared. Publish from either page and both show the result. If sales were published from the other page while you had a draft open, Publish asks before replacing them.

For the first load, publish sales from the Dashboard so the full invoice detail is kept, then the rope and extruder files from the Explorer.

New figures never need a code change or a redeploy.

## Changing the app

The site deploys automatically from the `main` branch of this repository. Pushing to `main` updates the live site. Published figures are stored separately and are not affected.

The publisher key is the site's `PPC_PUBLISH_KEY` setting on Netlify.

Never commit workbooks, the `data` folder, or real figures. `.gitignore` covers the usual cases, but check before pushing, because this repository may be public.

## Running it on one computer

It needs Node.js. Double-click **Start reports.bat**, or run:

```bash
node server/server.js
```

The home page is http://localhost:8088/. Keep the window open while using the reports.

The first start publishes the three Excel files from the folder above this one, if they are there. The local publisher key is in `data/publish-key.txt`, which is created on first start.

Local copies keep their figures in `data/`: `sets/` holds what is published, `archive/versions/` every version ever published, and `archive/files/` every uploaded workbook.

## Layout

- `public/`: the two pages. `js/ppc.js` adds the viewer and publisher modes and the Publish button
- `server/api.js`: the publish rules, shared by the local server and the cloud
- `server/server.js`, `server/storage.js`: the local server and its storage
- `netlify/functions/api.mjs`, `server/blob-storage.mjs`: the cloud function and its storage
- `tools/`: first-time data load for local copies

## Differences from the original pages

- **Sales totals:** these copies stop reading the sales register at its TOTAL row. The original pages also counted a stray sum typed below that row as part of the last invoice.
- **Invoice photos and PDFs:** reading these needs the claude.ai service, so it says it isn't available here. Use Upload Excel or Add manually.
- **Built-in figures:** these copies have none. A page shows figures only after they are published.
