import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8080;
const HOME_PAGE_HTML = fs.readFileSync('index.html');

// Validate cli arguments
if (process.argv.length !== 3) {
    console.error('Incorrect arguments. You must supply exactly 1 argument.');
    console.error('Usage: npm start /path/to/images');
    process.exit(1);
}

// Load image paths into memory
const IMAGE_PATH = path.resolve(process.argv[2]);
const IMAGES = [];
try {
    fs.readdirSync(IMAGE_PATH).forEach(dir => {
        if (dir.startsWith('.')) {
            return;
        }
        const dirPath = path.resolve(IMAGE_PATH, dir);
        fs.readdirSync(dirPath).forEach(file => {
            if (file.startsWith('.')) {
                return;
            }
            IMAGES.push({
                path: path.resolve(dirPath, file),
                dir,
                file,
            });
        });
    });
} catch (e) {
    console.error('Unable to load image path. Ensure the path you provided is valid.');
    console.error('Path:', IMAGE_PATH)
    console.error(' ');
    throw e;
}

console.info('Loaded images', IMAGES.length, 'from path:', IMAGE_PATH);
console.info(' ');

console.info('Starting server...')
console.info('  ');
http.createServer((req, res) => {
    const path = req.url.trim().replace(/^\/+|\/+$/g, '').split('/')

    switch (path[0]) {
        // main html page
        case '':
            res.write(HOME_PAGE_HTML);
            break;

        // image methods
        case 'image':
            const imageIndex = parseInt(path[1], 10);
            if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= IMAGES.length) {
                res.writeHead(404, 'Image not found');
                break;
            }

            switch (req.method.toUpperCase()) {
                case 'GET':
                    // get image by index
                    res.writeHead(200, { 'Content-Type': 'application/json' })

                    const image = IMAGES[imageIndex];
                    const imageData = {
                        ...image,
                        data: image.deleted ? '' : fs.readFileSync(IMAGES[imageIndex].path).toString('base64'),
                        length: IMAGES.length,
                    };
                    res.write(JSON.stringify(imageData));
                    break;
                case 'DELETE':
                    // delete image by index
                    res.writeHead(200, 'Deleted')
                    try {
                        fs.rmSync(IMAGES[imageIndex].path);
                        console.info('  ');
                        console.info('Deleted Image', imageIndex, IMAGES[imageIndex].path);
                    } catch (e) {
                        console.error('  ');
                        console.error('Failed to delete Image', imageIndex, IMAGES[imageIndex].path);
                        console.error(e);
                    }
                    IMAGES[imageIndex].deleted = true;
                    break;
            }
            break;

        // 404 not found
        default:
            res.writeHead(404, 'Not Found');
    }
    // end the response
    res.end();
}).listen(PORT, () => {
    console.info('LISTENING ON PORT', PORT);
    console.info(' ');
    console.info(`Open browser to: http://localhost:${PORT}`)
    console.info(' ');
});