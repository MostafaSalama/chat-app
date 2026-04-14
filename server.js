const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      background: #eae6df;
      display: flex;
      flex-direction: column;
    }

    /* ── Login ── */
    #login {
      position: fixed; inset: 0;
      background: linear-gradient(135deg, #075e54 0%, #128c7e 100%);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      transition: opacity .3s;
    }
    #login.hidden { opacity: 0; pointer-events: none; }

    #login-box {
      background: #fff;
      padding: 36px 32px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
      display: flex; flex-direction: column; gap: 14px;
      width: 320px;
    }
    #login-box .brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 4px;
    }
    #login-box .brand-icon {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #075e54, #25d366);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }
    #login-box .brand h2 { font-size: 22px; color: #111; font-weight: 700; }
    #login-box p { font-size: 13px; color: #888; margin-top: -8px; }

    .name-input {
      padding: 11px 16px;
      border: 1.5px solid #e0e0e0;
      border-radius: 10px;
      font-size: 15px;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      color: #222;
    }
    .name-input:focus {
      border-color: #25d366;
      box-shadow: 0 0 0 3px rgba(37,211,102,.12);
    }

    #join-btn {
      padding: 12px;
      background: linear-gradient(135deg, #075e54, #25d366);
      color: #fff; border: none;
      border-radius: 10px;
      font-size: 15px; font-weight: 600;
      cursor: pointer;
      transition: opacity .2s, transform .1s;
    }
    #join-btn:hover { opacity: .9; transform: translateY(-1px); }
    #join-btn:active { transform: translateY(0); }

    /* ── Chat layout ── */
    #chat { display: none; flex-direction: column; height: 100vh; }

    #header {
      background: #075e54;
      color: #fff;
      padding: 0 20px;
      height: 60px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
      flex-shrink: 0;
    }
    #header .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    #header .info h1 { font-size: 17px; font-weight: 600; }
    #header .info .online {
      font-size: 12px; opacity: .8;
      display: flex; align-items: center; gap: 4px;
    }
    #header .info .online .dot {
      width: 7px; height: 7px;
      background: #25d366; border-radius: 50%;
      display: inline-block;
    }

    /* ── Messages ── */
    #messages {
      flex: 1; overflow-y: auto; padding: 16px 12px;
      display: flex; flex-direction: column; gap: 4px;
    }
    #messages::-webkit-scrollbar { width: 5px; }
    #messages::-webkit-scrollbar-track { background: transparent; }
    #messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    .msg-row {
      display: flex; align-items: flex-end; gap: 8px;
      animation: fadeUp .18s ease;
    }
    .msg-row.self { flex-direction: row-reverse; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .msg-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      font-size: 12px; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .msg-bubble {
      max-width: 68%;
      padding: 8px 12px 6px;
      border-radius: 12px;
      font-size: 14.5px;
      line-height: 1.45;
      box-shadow: 0 1px 2px rgba(0,0,0,.12);
      position: relative;
    }
    .msg-row:not(.self) .msg-bubble {
      background: #fff;
      color: #111;
      border-bottom-left-radius: 4px;
    }
    .msg-row.self .msg-bubble {
      background: #dcf8c6;
      color: #111;
      border-bottom-right-radius: 4px;
    }

    .msg-sender {
      font-size: 12px; font-weight: 600;
      margin-bottom: 2px;
    }
    .msg-text { word-break: break-word; }
    .msg-time {
      font-size: 11px; color: #999;
      text-align: right; margin-top: 3px;
    }
    .msg-row.self .msg-time { color: #7fae71; }

    /* System messages */
    .sys-msg {
      text-align: center;
      font-size: 12px; color: #888;
      background: rgba(255,255,255,.6);
      padding: 4px 12px; border-radius: 12px;
      align-self: center;
      margin: 4px 0;
    }

    /* Typing indicator */
    #typing {
      padding: 4px 16px;
      font-size: 12px; color: #888;
      min-height: 20px;
    }

    /* ── Input row ── */
    #input-row {
      display: flex; gap: 10px;
      padding: 10px 14px;
      background: #f0f2f5;
      border-top: 1px solid #ddd;
    }
    #input {
      flex: 1; padding: 11px 16px;
      border: none;
      border-radius: 24px;
      font-size: 15px; outline: none;
      background: #fff;
      color: #222;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    #send-btn {
      width: 44px; height: 44px;
      background: #075e54;
      color: #fff; border: none;
      border-radius: 50%;
      font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s, transform .1s;
      flex-shrink: 0;
    }
    #send-btn:hover { background: #128c7e; transform: scale(1.05); }
    #send-btn:active { transform: scale(.97); }
  </style>
</head>
<body>

  <!-- Login -->
  <div id="login">
    <div id="login-box">
      <div class="brand">
        <div class="brand-icon">💬</div>
        <div class="brand"><h2>ChatApp</h2></div>
      </div>
      <p>Enter your name to join the chat</p>
      <input id="first-name" class="name-input" type="text" placeholder="First name" maxlength="30" autocomplete="off">
      <input id="last-name"  class="name-input" type="text" placeholder="Last name"  maxlength="30" autocomplete="off">
      <button id="join-btn" onclick="join()">Join Chat</button>
    </div>
  </div>

  <!-- Chat -->
  <div id="chat">
    <div id="header">
      <div class="avatar">💬</div>
      <div class="info">
        <h1>ChatApp</h1>
        <div class="online"><span class="dot"></span><span id="online-count">0 online</span></div>
      </div>
    </div>
    <div id="messages"></div>
    <div id="typing"></div>
    <div id="input-row">
      <input id="input" type="text" placeholder="Type a message…" autocomplete="off">
      <button id="send-btn" onclick="send()">➤</button>
    </div>
  </div>

  <script>
    let userName = '';
    let typingTimer;

    const AVATAR_COLORS = [
      '#e53935','#d81b60','#8e24aa','#3949ab',
      '#00897b','#43a047','#fb8c00','#6d4c41','#039be5'
    ];
    const colorCache = {};

    function avatarColor(name) {
      if (!colorCache[name]) {
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        colorCache[name] = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
      }
      return colorCache[name];
    }

    function initials(name) {
      const p = name.trim().split(' ');
      return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
    }

    function formatTime(iso) {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const ws = new WebSocket('ws://' + location.host);
    const messagesEl = document.getElementById('messages');
    const inputEl    = document.getElementById('input');
    const typingEl   = document.getElementById('typing');

    ws.onmessage = e => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }

      if (data.type === 'system') {
        appendSystem(data.text);
      } else if (data.type === 'count') {
        document.getElementById('online-count').textContent =
          data.count + ' online';
      } else if (data.type === 'typing') {
        showTyping(data.sender, data.active);
      } else if (data.type === 'message') {
        appendMessage(data);
      }
    };

    // Typing state
    const typingUsers = new Set();
    function showTyping(sender, active) {
      if (sender === userName) return;
      active ? typingUsers.add(sender) : typingUsers.delete(sender);
      if (typingUsers.size === 0) {
        typingEl.textContent = '';
      } else {
        const names = [...typingUsers];
        typingEl.textContent = names.length === 1
          ? names[0] + ' is typing…'
          : names.slice(0,-1).join(', ') + ' and ' + names.at(-1) + ' are typing…';
      }
    }

    function appendSystem(text) {
      const el = document.createElement('div');
      el.className = 'sys-msg';
      el.textContent = text;
      messagesEl.appendChild(el);
      scrollBottom();
    }

    function appendMessage({ sender, text, timestamp }) {
      const isSelf = sender === userName;
      const row = document.createElement('div');
      row.className = 'msg-row' + (isSelf ? ' self' : '');

      const av = document.createElement('div');
      av.className = 'msg-avatar';
      av.style.background = avatarColor(sender);
      av.textContent = initials(sender);

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';

      if (!isSelf) {
        const senderEl = document.createElement('div');
        senderEl.className = 'msg-sender';
        senderEl.style.color = avatarColor(sender);
        senderEl.textContent = sender;
        bubble.appendChild(senderEl);
      }

      const textEl = document.createElement('div');
      textEl.className = 'msg-text';
      textEl.textContent = text;
      bubble.appendChild(textEl);

      const timeEl = document.createElement('div');
      timeEl.className = 'msg-time';
      timeEl.textContent = formatTime(timestamp);
      bubble.appendChild(timeEl);

      row.appendChild(av);
      row.appendChild(bubble);
      messagesEl.appendChild(row);
      scrollBottom();
    }

    function scrollBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function join() {
      const first = document.getElementById('first-name').value.trim();
      const last  = document.getElementById('last-name').value.trim();
      if (!first || !last) return;
      userName = first + ' ' + last;
      document.getElementById('login').classList.add('hidden');
      document.getElementById('chat').style.display = 'flex';
      inputEl.focus();
      ws.send(JSON.stringify({ type: 'join', sender: userName }));
    }

    function send() {
      const text = inputEl.value.trim();
      if (!text) return;
      ws.send(JSON.stringify({ type: 'message', sender: userName, text }));
      inputEl.value = '';
      // stop typing
      ws.send(JSON.stringify({ type: 'typing', sender: userName, active: false }));
    }

    // Typing detection
    inputEl.addEventListener('input', () => {
      ws.send(JSON.stringify({ type: 'typing', sender: userName, active: true }));
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        ws.send(JSON.stringify({ type: 'typing', sender: userName, active: false }));
      }, 2000);
    });

    document.getElementById('first-name').addEventListener('keydown', e =>
      e.key === 'Enter' && document.getElementById('last-name').focus());
    document.getElementById('last-name').addEventListener('keydown', e =>
      e.key === 'Enter' && join());
    inputEl.addEventListener('keydown', e =>
      e.key === 'Enter' && send());
  </script>
</body>
</html>`);
});

const wss = new WebSocket.Server({ server });

function broadcast(data, except) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN && c !== except) c.send(msg);
  });
}

function broadcastAll(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

function sendCount() {
  broadcastAll({ type: 'count', count: wss.clients.size });
}

wss.on('connection', ws => {
  sendCount();

  ws.on('message', raw => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === 'join') {
      ws.senderName = data.sender;
      broadcast({ type: 'system', text: data.sender + ' joined the chat' }, ws);
      sendCount();

    } else if (data.type === 'message') {
      broadcastAll({
        type: 'message',
        sender: data.sender,
        text: data.text,
        timestamp: new Date().toISOString()
      });

    } else if (data.type === 'typing') {
      broadcast({ type: 'typing', sender: data.sender, active: data.active }, ws);
    }
  });

  ws.on('close', () => {
    if (ws.senderName) {
      broadcast({ type: 'system', text: ws.senderName + ' left the chat' }, ws);
    }
    sendCount();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Chat running at http://localhost:' + PORT));
