require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();

// Helper functions for contacts
function readContacts() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'contacts.json'), 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

function writeContacts(contacts) {
    fs.writeFileSync(
        path.join(__dirname, 'contacts.json'),
        JSON.stringify(contacts, null, 2),
        'utf8'
    );
}


// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'your_client_id',
    process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret',
    process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
);

function saveTokens(tokens) {
    try {
        fs.writeFileSync(path.join(__dirname, '.tokens.json'), JSON.stringify(tokens), 'utf8');
    } catch (error) {
        console.error('Error saving tokens:', error);
    }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Routes

// GET - Serve static files explicitly
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

// GET - Serve images and videos from EDUTOUR PICS directory
app.get('/EDUTOUR PICS/:filename', (req, res) => {
    const filename = req.params.filename;

    // Basic protection against path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid filename'
        });
    }

    const filePath = path.join(__dirname, 'EDUTOUR PICS', filename);


    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
        res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
        res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
        res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.mp4') {
        res.setHeader('Content-Type', 'video/mp4');
    } else if (ext === '.webm') {
        res.setHeader('Content-Type', 'video/webm');
    } else if (ext === '.ogg') {
        res.setHeader('Content-Type', 'video/ogg');
    }

    res.sendFile(filePath);
});

// GET - Serve specific static files (wp.jpg, NABS.jpeg)
app.get('/wp.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'wp.jpg'));
});

app.get('/NABS.jpeg', (req, res) => {
    res.sendFile(path.join(__dirname, 'NABS.jpeg'));
});

// GET - Serve main portfolio page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET - Handle contact form GET request (returns all contacts)
app.get('/api/contact', async (req, res) => {
    try {
        const contacts = readContacts();
        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        console.error('Error retrieving contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving contacts',
            error: error.message
        });
    }
});

// POST - Handle contact form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /.+\@.+\..+/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create new contact object
        const newContact = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            createdAt: new Date().toISOString()
        };

        // Read existing contacts
        const contacts = readContacts();
        
        // Add new contact
        contacts.push(newContact);
        
        // Write to file
        writeContacts(contacts);

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully!',
            data: newContact
        });

    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message. Please try again later.',
            error: error.message
        });
    }
});

// GET - Retrieve all contacts (admin endpoint)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = readContacts();
        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving contacts',
            error: error.message
        });
    }
});

// GET - Retrieve a specific contact by ID
app.get('/api/contacts/:id', async (req, res) => {
    try {
        const contacts = readContacts();
        const contact = contacts.find(c => c.id === req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving contact',
            error: error.message
        });
    }
});

// DELETE - Delete a contact
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const contacts = readContacts();
        const contactIndex = contacts.findIndex(c => c.id === req.params.id);

        if (contactIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const deletedContact = contacts.splice(contactIndex, 1);
        writeContacts(contacts);

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully',
            data: deletedContact[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting contact',
            error: error.message
        });
    }
});

// Google Drive API Routes
// NOTE: This app stores tokens in a local `.tokens.json` file after OAuth.
// If you want Drive browsing to work after restart, you must set GOOGLE_CLIENT_ID
// and GOOGLE_CLIENT_SECRET env vars and re-auth once.

// GET - Initiate Google Drive authentication
app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// GET - Handle Google Drive authentication callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        saveTokens(tokens);
        console.log('✓ Google Drive authentication successful');
        res.redirect('/?auth=success');
    } catch (error) {
        console.error('Error during Google Drive authentication:', error);
        res.redirect('/?auth=error');
    }
});

// GET - Retrieve Google Drive files
app.get('/api/drive/files', async (req, res) => {
    try {
        // Best-effort load saved tokens (so refresh/server restart keeps auth)
        try {
            const tokenPath = path.join(__dirname, '.tokens.json');
            if (fs.existsSync(tokenPath)) {
                const raw = fs.readFileSync(tokenPath, 'utf8');
                const savedTokens = JSON.parse(raw);
                oauth2Client.setCredentials(savedTokens);
            }
        } catch (_) {}

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const response = await drive.files.list({
            pageSize: 10,
            fields: 'files(id, name, webViewLink, mimeType)',
        });

        res.status(200).json({
            success: true,
            files: response.data.files
        });
    } catch (error) {
        console.error('Error retrieving Google Drive files:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving Google Drive files',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
    });
});

// Start server
const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Portfolio server running on http://localhost:${PORT}`);
console.log(`📧 Contact API: http://localhost:${PORT}/api/contact`);
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing server process and restart.`);
    } else {
        console.error('Server failed to start:', err);
    }
});

