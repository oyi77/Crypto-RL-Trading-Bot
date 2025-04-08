import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { join } from 'path';
import { readFileSync } from 'fs';
import { logInfo } from '../utils/logger';

export class DashboardServer {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private staticDir: string;

    constructor(port: number = 3001) {
        this.staticDir = join(__dirname, 'public');
        
        const server = createServer((req, res) => {
            if (req.url === '/') {
                const html = readFileSync(join(this.staticDir, 'index.html'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else if (req.url === '/dashboard.js') {
                const js = readFileSync(join(this.staticDir, 'dashboard.js'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(js);
            } else {
                res.writeHead(404);
                res.end();
            }
        });

        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            logInfo('New dashboard client connected');

            ws.on('close', () => {
                this.clients.delete(ws);
                logInfo('Dashboard client disconnected');
            });
        });

        server.listen(port, () => {
            logInfo(`Dashboard server running on port ${port}`);
        });
    }

    broadcast(data: any) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    sendInitialData(data: any) {
        this.broadcast({
            type: 'init',
            data
        });
    }

    sendUpdate(data: any) {
        this.broadcast({
            type: 'update',
            data
        });
    }

    sendSignal(signal: any) {
        this.broadcast({
            type: 'signal',
            data: signal
        });
    }
} 