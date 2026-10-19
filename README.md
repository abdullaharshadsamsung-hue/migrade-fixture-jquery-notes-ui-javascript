# Notes UI

A notes user interface migrated from a jQuery codebase to React. Both modules of the original application (2/2) have been ported to React components written in TypeScript.

> **Status:** The project builds and its unit test run passes. Behavior has **not** yet been compared against the original jQuery application. See [Manual review required](#manual-review-required) before treating this as a drop-in replacement.

## Tech stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| UI library   | React                                 |
| Language     | TypeScript (`tsconfig.json`)          |
| Dev server   | Vite (`vite.config.ts`)               |
| Test runner  | Vitest                                |
| Package mgmt | npm (`package.json`)                  |

For exact dependency versions, see `package.json`.

## Prerequisites

- Node.js and npm. The required versions are not pinned in this README, so check `package.json` for any `engines` constraints.
- Port `8080` must be free on the host. The run command uses `--strictPort`, so Vite exits instead of falling back to another port.

No database is required.

## Getting started

Run these steps in order from a fresh clone:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set environment variables** (see [Environment variables](#environment-variables))

   ```bash
   export PORT=8080
   ```

3. **Database setup:** not applicable. This project has no database setup step.

4. **Additional setup:** none. The migration did not need any extra dependency-resolution or fix commands.

5. **Run the dev server**

   ```bash
   npx vite --host 0.0.0.0 --port 8080 --strictPort
   ```

   The app is served at `http://localhost:8080`. Because of `--host 0.0.0.0`, it is also reachable from other machines on the network.

## Running tests

```bash
npx vitest run --passWithNoTests
```

The `--passWithNoTests` flag makes this command succeed even when no test files exist. A passing run therefore does **not** confirm that any tests were executed. Check the Vitest output for the number of test files and tests run.

## Environment variables

| Variable | Required | Example | Description |
| -------- | -------- | ------- | ----------- |
| `PORT`   | Yes (detected) | `8080` | Port for the dev server. **Note:** the run command passes `--port 8080` explicitly, and that flag takes precedence over any port set in `vite.config.ts`. Check `vite.config.ts` to confirm whether `PORT` is actually read. If you change the port, change the `--port` value as well. |

## Architecture overview

```
index.html              # HTML entry point loaded by Vite
package.json            # Dependencies and npm metadata
tsconfig.json           # TypeScript compiler configuration
vite.config.ts          # Vite dev server / build configuration
src/
  main.tsx              # Bootstraps React and mounts the app into index.html
  App.tsx               # Root application component
  pages/
    NotesPage.tsx       # Notes page: the main notes UI
```

How the app loads:

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` mounts the root component.
3. `src/App.tsx` is the root component and renders the notes UI from `src/pages/NotesPage.tsx`.

Verify the exact wiring (routing, props, state ownership) by reading `src/App.tsx` and `src/main.tsx`.

## Migration notes

- **Source → target:** jQuery (JavaScript) → React (TypeScript, `.tsx`).
- **Coverage:** 2 of 2 modules were migrated. No components were marked as unmigratable or low-confidence.
- **Paradigm change:** imperative jQuery DOM manipulation and event binding was replaced with declarative React components. Under-the-hood behavior may differ from the original in these areas:
  - event timing
  - DOM structure and CSS selectors
  - focus handling
  - initial render state
- **Tooling:** the project now uses Vite as the dev server and bundler and Vitest as the test runner.
- **Confidence:** the migration tool reported a self-assessed confidence of 97%. This is a model estimate, **not** a measured result, and it should not replace verification.

### Verification status

| Check | Result |
| ----- | ------ |
| Build | Passed |
| Target unit tests | Passed (see the note on `--passWithNoTests` above) |
| Behavior compared with the original jQuery app | **Not run** |

## Known limitations

- **No behavioral parity check.** The migrated app has not been compared side by side with the original jQuery version. Functional equivalence is unconfirmed.
- **Test coverage is unknown.** Because tests run with `--passWithNoTests`, a passing result may reflect zero executed tests.
- **Port is hard-coded in the run command.** The run command uses `--port 8080` with `--strictPort`, so the server will not start if port 8080 is in use. The relationship between the `PORT` variable and the actual port has not been verified.
- No components were flagged as unmigratable, and no setup commands failed during migration.

## Manual review required

Review the following before relying on this migration:

- [ ] **`src/pages/NotesPage.tsx`**: compare against the original jQuery notes UI. Check all user interactions and state changes, plus any data loading or persistence the original performed.
- [ ] **`src/App.tsx`**: confirm the root component renders the same views and initial state as the original page.
- [ ] **`src/main.tsx`** and **`index.html`**: confirm the mount point and any global markup, styles, or scripts from the original page were carried over.
- [ ] **`vite.config.ts`**: confirm whether `PORT` is used and that the server settings match your deployment needs.
- [ ] **Tests**: confirm that `npx vitest run --passWithNoTests` actually executes tests. If none exist, add tests covering the notes UI behavior.
- [ ] **Behavior comparison**: run the original jQuery app and this React app side by side and exercise the same workflows in both.