# Shadcn-UI Template Usage Instructions

## technology stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

All shadcn/ui components have been downloaded under `@/components/ui`.

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

The `@/` path alias points to the `src/` directory

## Firebase setup (optional in local development)

OrangeFlix uses TMDB for catalogue metadata and Firebase for user-owned data. Copy `.env.example` into `.env` and add the Firebase Web App values from the Firebase console. Enable **Email/Password** and **Google** in Firebase Authentication, add your local/production domains to Firebase's authorized domains, and create a Firestore database before deploying.

When all `VITE_FIREBASE_*` values are present, the app enables Firebase Auth, persistent sessions, password resets, user/profile documents, and mirrored watchlist items. Without them, the existing local development auth and storage fallback remains active.

Firestore paths used by the app:

- `users/{uid}` and `profiles/{uid}`
- `watchlists/{uid}/items/{contentId}`
- `watchHistory/{uid}/items/{contentId}`
- `ratings/{uid}/items/{contentId}`

# Commands

**Install Dependencies**

```shell
npm i
```

**Start Preview**

```shell
npm run dev
```

**To build**

```shell
npm run build
```
