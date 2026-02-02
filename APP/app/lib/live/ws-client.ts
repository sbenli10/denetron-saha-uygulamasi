// APP/app/lib/live/ws-client.ts

export type LiveMessage =
  | {
      type: "LIVE_KPI_UPDATE";
      payload: {
        activeInspections: number;
        completedTasks: number;
        newUsers: number;
        pendingReports: number;
      };
    }
  | {
      type: "PING";
    };

type Callback = (msg: LiveMessage) => void;

export class LiveWS {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Callback[] = [];
  private reconnectTimer: any = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[LiveWS] Connected");
      this.pingLoop();
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        this.listeners.forEach((cb) => cb(msg));
      } catch (e) {
        console.error("[LiveWS] Invalid message", evt.data);
      }
    };

    this.ws.onclose = () => {
      console.warn("[LiveWS] Disconnected. Reconnecting...");
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      console.warn("[LiveWS] Error. Closing & reconnecting...");
      this.ws?.close();
    };
  }

  onMessage(cb: Callback) {
    this.listeners.push(cb);
  }

  private pingLoop() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "PING" }));
      }
    }, 10000);
  }
}
