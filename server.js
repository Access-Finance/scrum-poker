const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// In-memory state (no database). Lost on restart — acceptable for ephemeral
// estimation rounds.
// ---------------------------------------------------------------------------
const participants = new Map(); // socket.id -> { name, vote: number | null }
let revealed = false;

// Build a client-safe snapshot. Vote values are withheld until revealed.
function snapshot() {
  return {
    revealed,
    participants: [...participants.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      hasVoted: p.vote !== null,
      vote: revealed ? p.vote : null,
    })),
  };
}

function broadcastState() {
  io.emit('state', snapshot());
}

// Reveal automatically once everyone present has voted.
function maybeReveal() {
  if (participants.size === 0) return;
  const allVoted = [...participants.values()].every((p) => p.vote !== null);
  if (allVoted) revealed = true;
}

io.on('connection', (socket) => {
  // Send current state to the freshly connected client (before they join,
  // so they can see the room).
  socket.emit('state', snapshot());

  socket.on('join', ({ name } = {}) => {
    const clean = String(name || '').trim().slice(0, 40);
    if (!clean) return;
    participants.set(socket.id, { name: clean, vote: null });
    broadcastState();
  });

  socket.on('vote', ({ hours } = {}) => {
    const p = participants.get(socket.id);
    if (!p) return;
    const n = Number(hours);
    if (!Number.isFinite(n) || n < 0) return;
    p.vote = n;
    maybeReveal();
    broadcastState();
  });

  socket.on('reset', () => {
    for (const p of participants.values()) p.vote = null;
    revealed = false;
    broadcastState();
  });

  socket.on('kick', ({ id } = {}) => {
    if (!participants.has(id)) return;
    participants.delete(id);
    // Disconnect the kicked socket so it stops receiving updates and is told.
    const target = io.sockets.sockets.get(id);
    if (target) {
      target.emit('kicked');
      target.disconnect(true);
    }
    // Kicking the last outstanding non-voter should trigger reveal.
    maybeReveal();
    broadcastState();
  });

  socket.on('disconnect', () => {
    if (!participants.has(socket.id)) return;
    participants.delete(socket.id);
    // A leaver shouldn't block the reveal for everyone else.
    maybeReveal();
    broadcastState();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Scrum poker running on http://localhost:${PORT}`);
});
