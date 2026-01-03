# Deploying Belgaum.ai to Hostinger

Since we have converted your project to a Next.js application with **Static Export** enabled, the deployment process is very straightforward.

## Step 1: Generate the Static Files

Run the following command in your terminal:

```bash
npm run build
```

This will create a folder named `out` in your project root.

## Step 2: Upload to Hostinger

1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager**.
3. Navigate to your domain's public folder (usually `public_html`).
4. Upload all the **contents** of the `out` folder directly into `public_html`.
   - *Note: Do not upload the `out` folder itself, just the files and folders inside it (like `_next`, `index.html`, etc.).*

## Step 3: (Optional) Using Node.js on Hostinger

If you prefer to run a dynamic Next.js server (i.e., not static export):

1. Disable static export in `next.config.ts` by removing `output: 'export'`.
2. Follow the [Hostinger Node.js deployment guide](https://www.hostinger.com/tutorials/how-to-deploy-next-js-app).
3. Use the **Node.js Selector** in hPanel to set the entry point to `.next/standalone/server.js` (after building with `output: 'standalone'`).

## Notes on Chatbot AI (Multi-LLM)

The Chatbot supports **Gemini** and **OpenAI**. To configure:

1. Open `.env.local`.
2. Set `NEXT_PUBLIC_LLM_PROVIDER` to either `gemini` or `openai`.
3. Fill in the relevant API keys and model names in their respective sections.
4. **Memory Cleanup**: Conversations are stored locally but automatically cleared after **5 minutes** of inactivity to keep sessions fresh.
5. **Static Export Security**: Reminder that `NEXT_PUBLIC_` variables are baked into the frontend build. For high security, consider using a Node.js backend.
