# Notes App (Remix) — Ocean Professional Theme

A simple, modern notes application built with Remix and Tailwind CSS. Create, view, edit, and delete textual notes. Data is stored in your browser (localStorage), so no backend is required.

- Framework: Remix (Vite)
- Styling: Tailwind CSS with Ocean Professional theme (blue + amber accents)
- Persistence: LocalStorage (client-side)

## Features

- Sidebar listing all notes
- Create a new note
- Select a note to view/edit in the main panel
- Delete notes
- Auto-save to browser storage
- Responsive layout with subtle gradients, rounded corners, and soft shadows

## Development

Run the dev server:

```shell
npm install
npm run dev
```

Open the app at the printed URL (default http://localhost:3000).

## Build and Run (Production)

```shell
npm run build
npm start
```

Deploy the output of `npm run build`:

- `build/server`
- `build/client`

## Theming

The Ocean Professional theme uses:

- Primary: `#2563EB`
- Secondary: `#F59E0B`
- Success: `#F59E0B`
- Error: `#EF4444`
- Background: `#f9fafb`
- Surface: `#ffffff`
- Text: `#111827`

These are exposed as CSS variables in `app/tailwind.css`.

## Notes

- All note data lives in localStorage under the key `remix-notes-v1`.
- To reset, clear your browser storage for this origin.

## License

MIT
