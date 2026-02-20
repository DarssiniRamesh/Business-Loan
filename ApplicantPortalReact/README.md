# Business Loan Applicant Portal (React)

## Requirements
- Node.js 18+

## Configure
This app uses existing container env vars prefixed with `REACT_APP_*`.

Copy the example file and adjust values:

```bash
cp .env.example .env
```

## Run (dev)
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- All API wiring is centralized in `src/api/endpoints.js`.
- JWT token is stored in sessionStorage by default (localStorage if “Remember me” is checked).
- Applicant pages:
  - `/dashboard`
  - `/apply`
  - `/documents?id=<applicationId>`
- Officer pages (requires user role `OFFICER` from `/api/auth/me`):
  - `/officer/queue`
  - `/officer/applications/:id`
