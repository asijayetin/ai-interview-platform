# Google sign-in setup

Google sign-in is implemented on the login and signup pages. It uses Google Identity Services in the browser and verifies Google's ID token on the API before creating or logging in a user.

## Configure the OAuth web client

1. In Google Cloud Console, configure the OAuth consent screen / Google Auth Platform branding and create an **OAuth client ID** with application type **Web application**.
2. Add the local frontend origin (usually `http://localhost:5173`) and the deployed frontend origin (for example, `https://your-site.example`) to **Authorized JavaScript origins**. Enter origins only, without a path.
3. Set the same Web client ID in both environments:
   - Frontend local env and Vercel: `VITE_GOOGLE_CLIENT_ID=<your-web-client-id>`
   - Backend local env and Render: `GOOGLE_CLIENT_ID=<the-same-web-client-id>`
4. Restart the local Vite/server processes and redeploy the frontend and backend after setting the variables.

The client ID is public configuration used to render the Google button; do not put a Google client secret in the frontend. The server validates the signed credential before issuing the app's own session token.
