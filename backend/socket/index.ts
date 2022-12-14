import * as express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import axios from 'axios';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

interface SocketCustomClient extends Socket {
  name?: string;
  color?: string;
}

io.on('connection', (client: SocketCustomClient) => {
  client.on('joinroom', (room, profile, callback) => {
    client.join(room);
    client.name = profile.name;
    client.color = profile.color;
    client.to(room).emit('new-user', client.id, profile.name, profile.color);
    // room에서 client들 정보 빼와서 보내기.
    // 클라이언트에서 필요한 정보 -> id / name / color
    const users = Array.from(io.sockets.adapter.rooms.get(room));
    callback(
      users.map((user) => {
        const userSocket: SocketCustomClient = io.sockets.sockets.get(user);
        const { id, name, color } = userSocket;
        return {
          id,
          name,
          color
        };
      })
    );
    // callback(Array.from(clients));
  });
  client.on('update-title', (newTitle) => {
    const roomName = Array.from(client.rooms)[1];
    client.to(roomName).emit('new-title', newTitle);
  });
  client.on('local-insert', async (data) => {
    const roomName = Array.from(client.rooms)[1];

    try {
      await axios.post(`http://localhost:8000/document/${roomName}/save-content`, {
        content: data
      });
      client.to(roomName).emit('remote-insert', data);
    } catch (e) {
      console.log(e);
    }
  });
  client.on('local-delete', async (data) => {
    const roomName = Array.from(client.rooms)[1];
    console.log('ROOMNAME : ', roomName);
    try {
      await axios.post(`http://localhost:8000/document/${roomName}/update-content`, {
        content: data
      });
      client.to(roomName).emit('remote-delete', data);
    } catch (e) {
      console.log(e);
    }
  });

  client.on('cursor-moved', (data) => {
    const id = client.id;
    const { cursorPosition, profile } = data;
    const roomName = Array.from(client.rooms)[1];
    client.to(roomName).emit('remote-cursor', {
      id,
      cursorPosition,
      profile
    });
  });

  client.on('disconnecting', () => {
    const id = client.id;
    const roomName = Array.from(client.rooms)[1];
    client.to(roomName).emit('delete-cursor', {
      id
    });
  });

  client.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

app.set('port', 8100);

httpServer.listen(app.get('port'), function () {
  console.log('Running on : ', 8100);
});
