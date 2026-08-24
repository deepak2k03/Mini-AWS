# Mini-AWS

## Run locally

1. Build the SSH instance image: `docker build -t mini-aws/ssh-instance:1.0.0 ./instance-image`.
2. Start MongoDB: `docker compose up -d mongo`.
3. Copy `api/.env.example` to `api/.env`. On Windows, set `DOCKER_SOCKET_PATH=//./pipe/docker_engine` and set `INSTANCE_KEY_DIR=../instance-keys`.
4. Install and start the API: `cd api; npm install; npm run dev`.
5. In another terminal, install and start the dashboard: `cd web; npm install; npm run dev`.

Open `http://localhost:5173`, paste an SSH public key (for example the contents of `~/.ssh/id_ed25519.pub`), launch an instance, then copy its SSH command.

`DEMO_AUTH=true` uses `x-user-id` / `local-user` only for local development. Replace it with verified JWT or session authentication before any deployment. The API needs Docker daemon access; deploy it as a tightly isolated worker service, never as a public service with an unrestricted Docker socket mount.

## Running the app
1. Start Docker Desktop and wait until it says it’s running.

2. Open PowerShell in the project folder:

```powershell
cd "C:\Users\sman5\OneDrive\Desktop\Mini_AWS"
```

3. Build the SSH instance image:

```powershell
docker build -t mini-aws/ssh-instance:1.0.0 .\instance-image
```

4. Start MongoDB:

```powershell
docker compose up -d mongo
```

5. Configure and start the API in a new PowerShell window:

```powershell
cd "C:\Users\sman5\OneDrive\Desktop\Mini AWS\api"
Copy-Item .env.example .env
notepad .env
```

In `.env`, ensure these values are present for Windows Docker Desktop:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/mini_aws
DOCKER_SOCKET_PATH=//./pipe/docker_engine
INSTANCE_IMAGE=mini-aws/ssh-instance:1.0.0
SSH_PUBLIC_HOST=localhost
INSTANCE_KEY_DIR=../instance-keys
CORS_ORIGIN=http://localhost:5173
DEMO_AUTH=true
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.6-flash
```

Then run:

```powershell
npm install
npm run dev
```

The API should report `API listening on http://localhost:4000`.

6. Start the React dashboard in another PowerShell window:

```powershell
cd "C:\Users\sman5\OneDrive\Desktop\Mini AWS\web"
npm install
npm run dev
```

Open the local address Vite prints—normally http://localhost:5173.

7. Get an SSH public key. If you do not already have one:

```powershell
ssh-keygen -t ed25519
```

Accept the default location. Then copy your public key:

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

8. In the dashboard:

- Click **Launch instance**
- Enter a name, such as `dev-box`
- Paste the full public-key line
- Click **Launch**

When its state becomes `running`, click its displayed SSH command to copy it. It will resemble:

```sh
ssh instance@localhost -p 49153
```

Paste and run that command in PowerShell to connect.

To stop all local infrastructure later:

```powershell
cd "C:\Users\sman5\OneDrive\Desktop\Mini AWS"
docker compose down
```

## AI Operations Assistant

The dashboard includes a Gemini-powered assistant alongside the existing manual controls. It only accepts requests to create, start, stop, or delete an instance. Add a free Google AI Studio key as `GEMINI_API_KEY` in `api/.env`; the key is used only by the API server and is never sent to the browser. The assistant always presents its proposed action and requires a separate confirmation before it can change an instance.
