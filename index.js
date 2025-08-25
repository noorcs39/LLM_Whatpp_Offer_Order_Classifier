const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const translate = require('@iamtraction/google-translate');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const notification = require('./notification');
const XLSX = require('xlsx');
const { spawn } = require('child_process');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;
const APP_URL = process.env.APP_URL || `http://159.69.33.88:${PORT}`;

// Python classification server should be started separately
// Run: python3 Deep/predictors/predict_roberta_perfect.py

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to Local MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err);
});


// ✅ Load keywords from Excel
const keywordList = [];
try {
  const workbook = XLSX.readFile('Deep/categories.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  keywordList.push(...data.map(row => row.keyword || row.Keyword).filter(Boolean));
  console.log(`✅ Loaded ${keywordList.length} keywords from Excel`);
} catch (err) {
  console.error('❌ Error loading Excel file:', err.message);
}

const orderKeywords = [
  "need", "looking", "require", "interested", "want", "buy", "searching","demand", "wish", "inquire", "search", "oder", "constance","🔎","🙏","👀"];
const offerKeywords = ["available", "offering", "have", "stock", "selling", "provide", "offer", "ready", "clearance", "discount","SEND"];

const messageSchema = new mongoose.Schema({
  number: String,
  name: String,
  message: String,
  translated: String,
  language: String,
  price: Number,
  image: String,
  category: String,
  timestamp: { type: Date, default: Date.now },
  link: String
});
const Message = mongoose.model('Message', messageSchema);

const NumberEntry = mongoose.model('NumberEntry', new mongoose.Schema({
  number: { type: String, unique: true },
  name: { type: String, default: '' }
}));

app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Routes =====
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/numbers', async (req, res) => {
  const numbers = await NumberEntry.find().sort({ number: 1 });
  res.json(numbers.map(n => ({ number: n.number, name: n.name || '' })));
});

app.get('/messages/:number', async (req, res) => {
  const messages = await Message.find({ number: req.params.number }).sort({ timestamp: -1 }).limit(100);
  res.json(messages);
});

app.get('/messages/category/:type', async (req, res) => {
  const messages = await Message.find({ category: req.params.type }).sort({ timestamp: -1 }).limit(100);
  res.json(messages);
});

app.get('/match_results.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'match_results.json'));
});

// ===== WhatsApp Management Routes =====
app.get('/whatsapp-numbers', async (req, res) => {
  try {
    const sessions = await Session.find({});
    const result = sessions.map(session => ({
      sessionId: session.sessionId,
      number: session.number || 'Pending',
      name: session.name || '',
      isActive: session.isActive,
      isRealTimeConnected: activeSessions.has(session.sessionId),
      connectedAt: session.connectedAt
    }));
    
    console.log('📱 Updated connected numbers:', result.map(s => `${s.number} (${s.isRealTimeConnected ? 'Connected' : 'Disconnected'})`).join(', '));
    res.json(result);
  } catch (error) {
    console.error('Error fetching WhatsApp numbers:', error);
    res.status(500).json({ error: 'Failed to fetch numbers' });
  }
});

app.post('/whatsapp-connect', async (req, res) => {
  const { name } = req.body;
  const sessionId = `session_${Date.now()}`;
  
  // Delete all previous session directories before starting a new connection
  const fs = require('fs');
  const path = require('path');
  const baseDir = __dirname;
  fs.readdirSync(baseDir).forEach(file => {
    if (file.startsWith('auth_info_session_')) {
      const fullPath = path.join(baseDir, file);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  });

  try {
    await startSocket(sessionId, name);
    
    // Wait for QR code to be generated
    let attempts = 0;
    const checkQR = () => {
      if (qrSessions.has(sessionId)) {
        const qr = qrSessions.get(sessionId);
        qrcode.toDataURL(qr, { small: true }, (err, url) => {
          if (err) {
            res.status(500).json({ error: 'Failed to generate QR' });
          } else {
            res.json({ qr: url.split(',')[1], sessionId });
          }
        });
      } else if (attempts < 30) {
        attempts++;
        setTimeout(checkQR, 1000);
      } else {
        res.status(500).json({ error: 'QR generation timeout' });
      }
    };
    
    checkQR();
  } catch (error) {
    console.error('Error starting socket:', error);
    res.status(500).json({ error: 'Failed to start connection' });
  }
});

app.get('/whatsapp-status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findOne({ sessionId });
  
  res.json({
    connected: activeSessions.has(sessionId),
    session: session
  });
});

app.post('/whatsapp-disconnect', async (req, res) => {
  const { number } = req.body;
  
  try {
    console.log('Attempting to disconnect number:', number);
    
    // Try to find session by number, with or without country code
    let session = await Session.findOne({ number, isActive: true });
    
    // If not found, try with country code prefix
    if (!session && !number.startsWith('9')) {
      session = await Session.findOne({ number: `92${number.substring(1)}`, isActive: true });
    }
    
    if (session) {
      console.log('Found session:', session.sessionId);
      const sock = activeSessions.get(session.sessionId);
      if (sock) {
        await sock.logout();
        activeSessions.delete(session.sessionId);
        console.log('Socket disconnected successfully');
      }
      
      // Clean up auth directory
      const authPath = `auth_info_${session.sessionId}`;
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('Auth directory cleaned up');
      }
      
      await Session.findOneAndUpdate({ sessionId: session.sessionId }, { isActive: false });
      console.log('Session marked as inactive');
      res.json({ success: true });
    } else {
      console.log('No active session found for number:', number);
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ===== Message Sender via UI =====
app.post('/send-message', async (req, res) => {
  const { to, text, imageBase64 } = req.body;
  try {
    // Get the active WhatsApp session
    let sock = activeSessions.get('default');
    
    // If no default session, try to find any active session
    if (!sock && activeSessions.size > 0) {
      sock = Array.from(activeSessions.values())[0];
    }
    
    if (!sock) {
      return res.status(500).send("WhatsApp not connected. Please connect a WhatsApp account first.");
    }
    
    // Ensure the number format is correct (remove any spaces or special characters)
    const cleanNumber = to.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    // Ensure the number has country code (add 92 if it starts with 3)
    const formattedNumber = cleanNumber.startsWith('3') ? `92${cleanNumber}` : cleanNumber;
    
    const jid = `${formattedNumber}@s.whatsapp.net`;
    
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, 'base64');
      await sock.sendMessage(jid, { image: buffer, caption: text });
    } else {
      await sock.sendMessage(jid, { text });
    }
    
    console.log(`[SENT MESSAGE] To: ${formattedNumber} via connected WhatsApp`);
    res.status(200).send("Message sent");
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).send("Failed to send");
  }
});

// ===== Enhanced NLP Classifier with non-product filtering =====
async function getCategoryFromLLM(text) {
  try {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 2) return 'skip';
    
    // Try to use ML classification system with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const res = await fetch('http://localhost:5006/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      const data = await res.json();
      const category = (data?.category || '').toLowerCase();
      const confidence = data?.confidence || 0;
      
      console.log('[ENHANCED CLASSIFICATION]', text);
      console.log('[CATEGORY]', category, '[CONFIDENCE]', confidence);
      
      return category;
    } catch (mlError) {
      clearTimeout(timeout);
      console.log('[ML SERVICE UNAVAILABLE] Using fallback classification');
      
      // Fallback to simple keyword-based classification
      const textLower = text.toLowerCase();
      
      // Simple keyword classification
      const offerKeywords = ['selling', 'available', 'ready', 'stock', 'offer', 'price', 'cost'];
      const orderKeywords = ['need', 'looking', 'want', 'buy', 'searching', 'interested', 'require'];
      
      let isOffer = offerKeywords.some(keyword => textLower.includes(keyword));
      let isOrder = orderKeywords.some(keyword => textLower.includes(keyword));
      
      if (isOffer && !isOrder) return 'offer';
      if (isOrder && !isOffer) return 'order';
      
      return 'skip'; // Skip if unclear
    }
  } catch (err) {
    console.error('Classification error:', err);
    return 'skip';
  }
}

// ===== Multi-WhatsApp Socket Management =====
const activeSessions = new Map();
const qrSessions = new Map();

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  number: String,
  name: String,
  isActive: { type: Boolean, default: true },
  connectedAt: { type: Date, default: Date.now }
});
const Session = mongoose.model('Session', SessionSchema);

async function startSocket(sessionId = 'default', name = '') {
  const authPath = `auth_info_${sessionId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  
  const sock = makeWASocket({ 
    auth: state, 
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrSessions.set(sessionId, qr);
    }
    
    if (connection === 'close') {
      const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        setTimeout(() => startSocket(sessionId, name), 3000);
      } else {
        activeSessions.delete(sessionId);
        await Session.findOneAndUpdate({ sessionId }, { isActive: false });
      }
    } else if (connection === 'open') {
      console.log(`WhatsApp ${sessionId} connected ✅`);
      activeSessions.set(sessionId, sock);
      
      // Update session with actual number
      const state = sock.authState.creds;
      const me = state.me;
      if (me) {
        await Session.findOneAndUpdate(
          { sessionId },
          { number: me.id.split('@')[0], name, isActive: true },
          { upsert: true }
        );
      }
      
      // Clean up QR
      qrSessions.delete(sessionId);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const number = msg.key.remoteJid.split('@')[0];
    const name = msg.pushName || "";
    const type = Object.keys(msg.message)[0];
    const msgId = msg.key.id;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
    const now = new Date();

    let imagePath = null;
    if (type === 'imageMessage') {
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      const filename = `images/${msgId}.jpg`;
      fs.writeFileSync(filename, buffer);
      imagePath = `/images/${msgId}.jpg`;
    }

    const priceMatch = text.match(/(?:Rs\.?|Price:|PKR|\$)?\s?(\d{3,6})/i);
    const price = priceMatch ? parseInt(priceMatch[1]) : null;

    let translatedText = text;
    let langCode = 'en';
    try {
      const result = await translate(text, { to: 'en' });
      translatedText = result.text;
      langCode = result.from.language.iso;
    } catch (err) {
      console.error('Translation error:', err);
    }

    // Log all incoming messages for monitoring
    console.log(`[INCOMING MESSAGE] From: ${number} (${name})`);
    console.log(`[ORIGINAL TEXT] ${text}`);
    console.log(`[TRANSLATED TEXT] ${translatedText}`);
    console.log(`[MESSAGE TYPE] ${type}`);
    if (price) console.log(`[DETECTED PRICE] ${price}`);
    if (imagePath) console.log(`[IMAGE ATTACHED] ${imagePath}`);

    // Store ALL messages in JSON file before filtering
    const allMessagesFile = 'all_messages.json';
    let allMessages = [];
    try {
      if (fs.existsSync(allMessagesFile)) {
        allMessages = JSON.parse(fs.readFileSync(allMessagesFile, 'utf8'));
      }
    } catch (err) {
      console.error('Error reading all_messages.json:', err);
    }
    
    const messageData = {
      number,
      name,
      message: text,
      translated: translatedText,
      language: langCode,
      price,
      image: imagePath,
      type,
      timestamp: now.toISOString(),
      messageId: msgId
    };
    
    allMessages.push(messageData);
    fs.writeFileSync(allMessagesFile, JSON.stringify(allMessages, null, 2));
    console.log(`[SAVED TO ALL_MESSAGES.JSON] ${text.substring(0, 100)}...`);

    const category = await getCategoryFromLLM(translatedText);

    // Log classification result
    console.log(`[CLASSIFICATION RESULT] ${category}`);

    // Skip non-product messages - enhanced filtering
    if (category === 'non-product' || category === 'skip') {
      console.log(`[FILTERED OUT] Non-product message - ${category}: ${text.substring(0, 100)}...`);
      return;
    }

    // Only process valid product messages (offer/order)
    const categoryLower = category.toLowerCase();
    if (categoryLower !== 'offer' && categoryLower !== 'order') {
      console.log(`[FILTERED OUT] Invalid category: ${category} - ${text.substring(0, 100)}...`);
      return;
    }

    // Log accepted message
    console.log(`[ACCEPTED MESSAGE] ${category.toUpperCase()} - ${text.substring(0, 100)}...`);

    // Store session info with message
    const sessionInfo = await Session.findOne({ sessionId });
    
    await NumberEntry.updateOne(
      { number },
      { $setOnInsert: { number, name } },
      { upsert: true }
    );

    const savedMsg = await new Message({
      number, name, message: text, translated: translatedText, language: langCode,
      price, image: imagePath, category: categoryLower, timestamp: now
    }).save();

    savedMsg.link = `${APP_URL}/index.html#msg-${savedMsg._id}`;
    await savedMsg.save();

    await runMatcher();
  });

  notification.initialize(sock);
}

function runMatcher() {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['Deep/matcher.py']);
    let data = '';
    python.stdout.on('data', (chunk) => { data += chunk.toString(); });
    python.stderr.on('data', (err) => console.error('Python error:', err.toString()));
    python.on('close', (code) => {
      if (code === 0) {
        fs.writeFileSync('match_results.json', data);
        console.log('✅ Updated match_results.json');
        resolve();
      } else {
        reject(new Error('Python matcher failed.'));
      }
    });
  });
}

// ===== Start Server =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Express Server running at http://159.69.33.88:${PORT}`);
  console.log(`✅ Server is ready for connections`);
  
  // Start WhatsApp connection
  console.log('🔄 Starting WhatsApp connection...');
  startSocket('default', 'Main Session');
});
