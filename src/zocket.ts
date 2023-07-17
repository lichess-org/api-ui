type OnServerMsg = (msg: any) => void;

interface Requested {
  url: string;
  onServerMsg: OnServerMsg;
  onConnect: Promise<void>;
}

interface Connected {
  ws: WebSocket;
  url: string;
}

class Zocket {
  requested?: Requested;
  connected?: Connected;

  constructor() {
  }

  connect = (url: string, onServerMsg: OnServerMsg): Promise<void> => {
    this.requested = { url, onServerMsg, onConnect: new Promise() };
    if (this.connected) await this.switchRoute(this.connected.ws, url, onServerMsg);
    else await this.create(this.requested);

    return this.requested.onConnect;
  };

  send = (msg: any): void => {};

  private switchRoute = (ws: WebSocket, url: string, onServerMsg: OnServerMsg): Promise<void> =>
    this.requested = { url, onServerMsg };
    ws.send({ d: 'switch', url });
    return new Promise((resolve, reject) => {
    });

  private create = (requested: Requested): Promise<void> =>
    new Promise((resolve, reject) => {
      const url = requested.url;
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.connected = { ws, url};
        resolve();
      };
      ws.onmessage = msg => {
        if (this.requested.url != this.connected?.url) console.warn(`Got msg from ${this.connected?.url} but client requested ${this.requested.url}`);
        else {
          if (msg.t == 'switch')
          else this.requested.onServerMsg(msg);
        }
      };
    });
}
