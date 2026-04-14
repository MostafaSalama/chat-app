const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Chat</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; background: #f0f2f5; }
    #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
    #messages div { background: #fff; border-radius: 8px; padding: 8px 12px; max-width: 70%; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
    #input-row { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: #fff; border-top: 1px solid #ddd; }
    #input-controls { display: flex; gap: 8px; align-items: flex-end; }
    #input {
      flex: 1; padding: 10px 14px; border: 1px solid #ccc; border-radius: 16px;
      font-size: 15px; outline: none; transition: border-color .2s;
      resize: none; overflow-y: hidden; line-height: 1.4; min-height: 42px; max-height: 140px;
      font-family: inherit; overflow-y: auto;
    }
    #input:focus { border-color: #0084ff; }
    #input:disabled { background: #f5f5f5; cursor: not-allowed; }
    #input-footer { display: flex; justify-content: space-between; padding: 0 4px; }
    #char-count { font-size: 12px; color: #999; }
    #char-count.near-limit { color: #f0a500; }
    #char-count.at-limit { color: #e53935; }
    #input-hint { font-size: 12px; color: #bbb; }
    #send-btn {
      padding: 10px 20px; background: #0084ff; color: #fff; border: none;
      border-radius: 24px; font-size: 15px; cursor: pointer; transition: background .2s;
      flex-shrink: 0; align-self: flex-end;
    }
    #send-btn:hover:not(:disabled) { background: #006ed6; }
    #send-btn:disabled { background: #aaa; cursor: not-allowed; }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-row">
    <div id="input-controls">
      <textarea id="input" rows="1" placeholder="Type a message…" maxlength="500" disabled></textarea>
      <button id="send-btn" onclick="send()" disabled>Send</button>
    </div>
    <div id="input-footer">
      <span id="char-count">0 / 500</span>
      <span id="input-hint">Enter to send · Shift+Enter for new line</span>
    </div>
  </div>
  <script>
    const ws = new WebSocket('ws://' + location.host);
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    const charCount = document.getElementById('char-count');
    const MAX = 500;

    function setConnected(on) {
      input.disabled = !on;
      sendBtn.disabled = !on;
      if (on) input.focus();
    }

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = e => {
      const div = document.createElement('div');
      div.textContent = e.data;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    };

    function autoResize() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
      const len = input.value.length;
      charCount.textContent = len + ' / ' + MAX;
      charCount.className = len >= MAX ? 'at-limit' : len >= MAX * 0.9 ? 'near-limit' : '';
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;
      ws.send(text);
      input.value = '';
      autoResize();
    }

    input.addEventListener('input', autoResize);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  </script>
</body>
</html>`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  ws.on('message', msg => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Chat running at http://localhost:${PORT}`));
