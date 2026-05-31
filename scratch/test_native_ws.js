const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

console.log('Starting headless Chrome Beta with custom profile...');
const chromeProcess = spawn('/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta', [
  '--headless=new',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--remote-allow-origins=*',
  '--no-sandbox',
  '--user-data-dir=scratch/chrome-profile'
]);

chromeProcess.on('error', (err) => {
  console.error('Failed to start Chrome process:', err);
});

chromeProcess.on('close', (code, signal) => {
  console.log(`Chrome process closed with code ${code} and signal ${signal}`);
});

let ws = null;
let retries = 0;
const maxRetries = 15;

function tryConnect() {
  retries++;
  console.log(`Attempting to connect to Chrome debug port (Attempt ${retries}/${maxRetries})...`);
  
  const req = http.get('http://127.0.0.1:9222/json/list', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const list = JSON.parse(data);
        if (list.length === 0) {
          console.error('No target pages found in Chrome.');
          setTimeout(tryConnect, 1000);
          return;
        }
        const wsUrl = list[0].webSocketDebuggerUrl;
        console.log('Successfully connected via native WebSocket to:', wsUrl);
        
        ws = new WebSocket(wsUrl);
        setupWebSocket(ws);
      } catch (err) {
        console.error('Failed to parse list:', err.message);
        if (retries < maxRetries) {
          setTimeout(tryConnect, 1000);
        } else {
          cleanup();
        }
      }
    });
  });

  req.on('error', (err) => {
    console.warn(`Connection failed: ${err.message}`);
    if (retries < maxRetries) {
      setTimeout(tryConnect, 1000);
    } else {
      console.error('Max retries reached. Exiting...');
      cleanup();
    }
  });
}

function setupWebSocket(wsInstance) {
  wsInstance.onopen = () => {
    console.log('WebSocket connection open. Enabling DevTools domains...');
    wsInstance.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    wsInstance.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    wsInstance.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
    
    console.log('Navigating to the target proposal URL...');
    wsInstance.send(JSON.stringify({
      id: 4,
      method: 'Page.navigate',
      params: { url: 'https://www.smartbidhub.com.br/proposta/ver/cmpsloy27000004jlxvb5n9xo' }
    }));
  };
  
  wsInstance.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const args = msg.params.args.map(a => a.value !== undefined ? a.value : JSON.stringify(a)).join(' ');
      console.log(`[Browser Console ${type}]`, args);
    }
    
    if (msg.method === 'Runtime.exceptionThrown') {
      const exception = msg.params.exceptionDetails;
      const desc = exception.exception?.description || exception.text;
      console.error(`[Browser Exception]`, desc);
    }
    
    if (msg.method === 'Log.entryAdded') {
      console.log(`[Browser Log ${msg.params.entry.level}]`, msg.params.entry.text);
    }
  };

  // Wait 10 seconds to allow the page load and capture any hydration errors
  setTimeout(() => {
    console.log('Capturing page screenshot to inspect the render state...');
    wsInstance.send(JSON.stringify({
      id: 5,
      method: 'Page.captureScreenshot',
      params: { format: 'png' }
    }));
    
    wsInstance.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 5) {
        if (msg.result && msg.result.data) {
          const buffer = Buffer.from(msg.result.data, 'base64');
          fs.writeFileSync('scratch/proposal_crash.png', buffer);
          console.log('Screenshot saved to scratch/proposal_crash.png');
        } else {
          console.error('Failed to take screenshot:', msg.error);
        }
        cleanup();
      }
    };
  }, 10000);
}

function cleanup() {
  if (ws) {
    try { ws.close(); } catch(e) {}
  }
  console.log('Killing Chrome process...');
  chromeProcess.kill();
  process.exit(0);
}

// Start first connection attempt after 3 seconds
setTimeout(tryConnect, 3000);
