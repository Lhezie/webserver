const http = require('http');
const fs = require('fs');
const path = require('path');

// Function to serve an HTML file
function serveFile(res, filePath, statusCode) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        } else {
            res.writeHead(statusCode, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
}

const server = http.createServer((req, res) => {
    const urlPath = req.url;
    const filePath = path.join(__dirname, urlPath);

    if (urlPath === '/index.html') {
        serveFile(res, path.join(__dirname, 'index.html'), 200);
    } else if (urlPath.endsWith('.html')) {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File does not exist, return 404 page
                serveFile(res, path.join(__dirname, '404.html'), 404);
            } else {
                // File exists (not /index.html), return the file
                serveFile(res, filePath, 200);
            }
        });
    } else {
        // If the request is for something other than .html, return 404
        serveFile(res, path.join(__dirname, '404.html'), 404);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});