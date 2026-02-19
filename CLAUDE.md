# TaskPile

Physics-based Linear issue visualization app.

## Architecture

- `app/` — Vite React frontend, deployed to Cloudflare Pages at **taskpile.dev**
- `worker/` — Cloudflare Worker (OAuth proxy), deployed at **api.taskpile.dev**

## Deployment

**After every commit to `main`, redeploy both services:**

```sh
# 1. Build and deploy the app
npm run build --workspace=app
npx wrangler pages deploy app/dist --project-name taskpile --branch main --commit-dirty=true

# 2. Deploy the worker
cd worker && npx wrangler deploy && cd ..
```

Both commands must succeed before considering the commit complete.

The app auto-deploys via Cloudflare Pages Git integration when connected, but always verify the deploy succeeded. The worker deploys via GitHub Actions on changes to `worker/`, but should also be deployed manually after local commits.
