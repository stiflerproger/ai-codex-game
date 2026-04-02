const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(__dirname, requestPath);
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES[extension] || "text/plain; charset=utf-8";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Файл не найден");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Игра доступна по адресу: http://localhost:${PORT}`);
});
