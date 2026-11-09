# Hosting under aryamandarda.com

The public artwork address is **https://aryamandarda.com/ascii-art/nyc/**. The artwork remains in this repository and the `ascii-art` Worker; the personal website can be a separate project.

## Routes

The Worker configuration owns only these explicit path routes:

```text
aryamandarda.com/ascii-art/nyc
aryamandarda.com/ascii-art/nyc/*
```

The first redirects to the trailing slash. The second serves the scene, its assets, and `/ascii-art/nyc/api/likes`. Internally, artwork assets remain in `web/artworks/nyc/`; the Worker rewrites the URL and HTML base path. Old `/projects/ASCII/nyc/` links redirect to the canonical artwork path. `/api/likes/nyc` remains compatible while the root is still hosted by this Worker.

`workers_dev: false` and `preview_urls: false` disable the production Worker's alternative `workers.dev` addresses, including version previews. This setting belongs in source control so a later deployment does not re-enable them.

## When the personal website launches

The domain currently has an apex Custom Domain attached to `ascii-art`. That gives the root a working origin today. When the personal website is ready:

1. Deploy the personal website in its separate project.
2. Remove the apex `custom_domain` entry from this repository's `wrangler.jsonc`, move the `aryamandarda.com` apex Custom Domain/origin to the website project, and keep its DNS record proxied through Cloudflare. Removing that entry prevents later artwork deployments from claiming the homepage again.
3. Preserve the two artwork path routes above, targeting `ascii-art`.
4. Verify the personal homepage at `/`, the artwork and its relative assets at `/ascii-art/nyc/`, and the like counter endpoint.

Cloudflare path routes take precedence over a Worker's Custom Domain on the same hostname. The artwork therefore keeps its URL while the homepage changes independently. Do not attach a Custom Domain containing a path; Custom Domains apply to the hostname, while Routes select paths.

References: [Cloudflare Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) and [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## Local verification and deployment

```sh
npm ci
npm run test:worker
npm run dev:worker
```

Open the printed local address at `/ascii-art/nyc/`. Tests cover the trailing-slash redirect, HTML base path, asset serving, and the like endpoint, alongside counter behavior.

The production Cloudflare build follows `main`. The deployment uses `wrangler.jsonc`, preserving the existing Durable Object binding and its stored reactions. The like counter is shared across the old and new paths; this change does not create a second counter.
