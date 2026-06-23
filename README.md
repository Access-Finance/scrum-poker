# 🃏 Scrum Poker

A lightweight, real-time planning-poker tool for a single team. Everyone joins
with their name and submits one estimate (in hours). When **all present
participants have voted, the cards reveal automatically**. Anyone can reset for a
new round or kick a participant — and kicking the last person who hasn't voted
will immediately trigger the reveal.

- **No database.** All state lives in server RAM, so a restart clears the round.
- **Live updates** over WebSockets (Socket.IO) — joins, votes, reveals, and
  resets push to everyone instantly.
- **Single shared session** — everyone who opens the URL is in the same room.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Open <http://localhost:3000> in two or more browser tabs to simulate a team.

## How it works

- Enter your name → **Join**.
- Enter your estimate in hours → **Submit** (you can change it until reveal).
- Watch the participant list update live. Each person shows `waiting…` or
  `✓ voted` until reveal.
- Once everyone has voted, all cards flip and a **Min / Avg / Max** summary
  appears (with a consensus message if everyone agrees).
- **Reset round** clears all votes and hides the cards again.
- **Kick** removes a participant (e.g. someone who left without voting).

## Deploy free (Render)

[Render](https://render.com)'s free web service tier supports WebSockets and
runs a Node app with no configuration.

1. Push this folder to a Git repository (GitHub/GitLab).
2. In Render: **New → Web Service**, connect the repo.
   - The included `render.yaml` sets it up automatically (build `npm install`,
     start `npm start`, free plan). Or configure manually with those commands.
3. Render injects a `PORT` env var, which the server already uses.

> **Note:** Free instances sleep after ~15 minutes of inactivity and cold-start
> on the next request. Because state is in RAM, a sleep or restart clears the
> current round — fine for ephemeral estimation.

### Other free options

Both also support WebSockets if you prefer them:

- **Fly.io** — free allowance; needs a small `Dockerfile` + `fly.toml`.
- **Railway** — trial credits; deploy a Node service directly.
