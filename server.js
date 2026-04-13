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
    #input-row { display: flex; gap: 8px; padding: 12px; background: #fff; border-top: 1px solid #ddd; }
    #input {
      flex: 1; padding: 10px 14px; border: 1px solid #ccc; border-radius: 24px;
      font-size: 15px; outline: none; transition: border-color .2s;
    }
    #input:focus { border-color: #0084ff; }
    #send-btn {
      padding: 10px 20px; background: #0084ff; color: #fff; border: none;
      border-radius: 24px; font-size: 15px; cursor: pointer; transition: background .2s;
    }
    #send-btn:hover { background: #006ed6; }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-row">
    <input id="input" type="text" placeholder="Type a message…">
    <button id="send-btn" onclick="send()">Send</button>
  </div>
  <script>
    const ws = new WebSocket('ws://' + location.host);
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');

    ws.onmessage = e => {
      const div = document.createElement('div');
      div.textContent = e.data;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    };

    function send() {
      if (input.value) {
        ws.send(input.value);
        input.value = '';
      }
    }

    input.addEventListener('keydown', e => e.key === 'Enter' && send());
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
