export default function query(sql: string) {
  // generate a random string to use as the reply channel
  const reply = Math.random().toString(36).substring(7);
  return new Promise((resolve) => {
    window.electron.ipcRenderer.once(reply, (resp) => {
      resolve(resp);
    });
    window.electron.ipcRenderer.sendMessage('db-query', [reply, sql]);
  });
}
