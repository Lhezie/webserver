const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'items.json');

// Helper function to read data from the JSON file
function readData(callback) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return callback(null, []); // File does not exist, return empty array
            return callback(err);
        }
        try {
            const items = JSON.parse(data);
            callback(null, items);
        } catch (parseErr) {
            callback(parseErr);
        }
    });
}

// Helper function to write data to the JSON file
function writeData(data, callback) {
    fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', callback);
}

// Helper function to send a JSON response
function sendJSONResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// API server
const server = http.createServer((req, res) => {
    const method = req.method;
    const url = req.url;
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        if (url === '/items') {
            if (method === 'GET') {
                // Get all items
                readData((err, items) => {
                    if (err) return sendJSONResponse(res, 500, { error: 'Failed to read data' });
                    sendJSONResponse(res, 200, { items });
                });
            } else if (method === 'POST') {
                // Create a new item
                try {
                    const newItem = JSON.parse(body);
                    if (!newItem.name || !newItem.price || !newItem.size || !newItem.id) {
                        return sendJSONResponse(res, 400, { error: 'Invalid item data' });
                    }
                    readData((err, items) => {
                        if (err) return sendJSONResponse(res, 500, { error: 'Failed to read data' });
                        items.push(newItem);
                        writeData(items, writeErr => {
                            if (writeErr) return sendJSONResponse(res, 500, { error: 'Failed to save data' });
                            sendJSONResponse(res, 201, { message: 'Item created', item: newItem });
                        });
                    });
                } catch (parseErr) {
                    sendJSONResponse(res, 400, { error: 'Invalid JSON data' });
                }
            } else {
                sendJSONResponse(res, 405, { error: 'Method not allowed' });
            }
        } else if (url.startsWith('/items/')) {
            const id = url.split('/')[2];
            if (!id) return sendJSONResponse(res, 400, { error: 'Invalid item ID' });

            if (method === 'GET') {
                // Get one item
                readData((err, items) => {
                    if (err) return sendJSONResponse(res, 500, { error: 'Failed to read data' });
                    const item = items.find(i => i.id === id);
                    if (!item) return sendJSONResponse(res, 404, { error: 'Item not found' });
                    sendJSONResponse(res, 200, { item });
                });
            } else if (method === 'PUT') {
                // Update an item
                try {
                    const updatedData = JSON.parse(body);
                    readData((err, items) => {
                        if (err) return sendJSONResponse(res, 500, { error: 'Failed to read data' });
                        const itemIndex = items.findIndex(i => i.id === id);
                        if (itemIndex === -1) return sendJSONResponse(res, 404, { error: 'Item not found' });
                        items[itemIndex] = { ...items[itemIndex], ...updatedData };
                        writeData(items, writeErr => {
                            if (writeErr) return sendJSONResponse(res, 500, { error: 'Failed to save data' });
                            sendJSONResponse(res, 200, { message: 'Item updated', item: items[itemIndex] });
                        });
                    });
                } catch (parseErr) {
                    sendJSONResponse(res, 400, { error: 'Invalid JSON data' });
                }
            } else if (method === 'DELETE') {
                // Delete an item
                readData((err, items) => {
                    if (err) return sendJSONResponse(res, 500, { error: 'Failed to read data' });
                    const itemIndex = items.findIndex(i => i.id === id);
                    if (itemIndex === -1) return sendJSONResponse(res, 404, { error: 'Item not found' });
                    const deletedItem = items.splice(itemIndex, 1);
                    writeData(items, writeErr => {
                        if (writeErr) return sendJSONResponse(res, 500, { error: 'Failed to save data' });
                        sendJSONResponse(res, 200, { message: 'Item deleted', item: deletedItem });
                    });
                });
            } else {
                sendJSONResponse(res, 405, { error: 'Method not allowed' });
            }
        } else {
            sendJSONResponse(res, 404, { error: 'Not found' });
        }
    });
});

const PORT = 5010;
server.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
});


