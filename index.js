const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const os = require('os');
const config = require("./config.json")
const port = config.port || 3000
const dir = config.dir || "uploads"
const lfu = config.logFileUploads || false

function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();

  // Loop through network interfaces
  for (const iface in networkInterfaces) {
    for (const ifaceDetails of networkInterfaces[iface]) {
      // Check for an external IPv4 address (not internal)
      if (ifaceDetails.family === 'IPv4' && !ifaceDetails.internal) {
        return ifaceDetails.address;  // Return the IPv4 address
      }
    }
  }

  return null;  // Return null if no address found
}

// Enable CORS for local testing (access from mobile device)

// Serve the uploaded files in the "uploads" folder as static files
app.use('/uploads', express.static(dir));

// Set up multer for file uploads (no size limit, handle images/videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir + '/'); // Store files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to filenames
  }
});

const upload = multer({ storage });

// Ensure the uploads folder exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Serve static files (HTML, CSS, JS) from the public folder
app.use(express.static('public'));

// Endpoint to receive photos and videos
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  if(lfu){
    req.file.timestamp = new Date().
    console.log(req.file)
  }
  res.status(200).send({
    message: 'File uploaded successfully',
    file: req.file
  });
});

// Endpoint to list all uploaded files
app.get('/files', (req, res) => {
  const files = fs.readdirSync(dir).map(file => {
    return {
      name: file,
      url: `/uploads/${file}`,  // Provide path for images/videos
      size: fs.statSync(path.join(dir, file)).size
    };
  });
  res.status(200).json(files);
});

// Endpoint to delete a file
app.delete('/file/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).send({ message: 'File deleted successfully' });
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\nRouter IP: http://${getLocalIP()}:${port}`);
});
