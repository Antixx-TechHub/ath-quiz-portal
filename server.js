const { createServer } = require('http');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = process.env.PORT || 3000;
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Next.js running on port ${port}`);
  });
});
