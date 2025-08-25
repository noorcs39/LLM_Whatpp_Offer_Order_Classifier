const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

let previousSent = [];
let connectedNumbers = new Set(); // Track connected WhatsApp numbers

// Function to fetch connected WhatsApp numbers
async function fetchConnectedNumbers() {
  try {
    const response = await fetch('http://localhost:3000/whatsapp-numbers');
    const sessions = await response.json();
    
    // Update connected numbers set
    connectedNumbers.clear();
    sessions.forEach(session => {
      if (session.number && session.isRealTimeConnected === true) {
        connectedNumbers.add(session.number);
      }
    });
    
    console.log(`📱 Updated connected numbers: ${Array.from(connectedNumbers).join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to fetch connected numbers:', error.message);
  }
}

function initialize(sock) {
  console.log('🟢 Realtime Notification Watcher started.');
  
  // Fetch connected numbers initially and every 30 seconds
  fetchConnectedNumbers();
  setInterval(fetchConnectedNumbers, 30000);

  // ✅ Load previously sent match IDs
  if (fs.existsSync('sent_matches.json')) {
    try {
      previousSent = JSON.parse(fs.readFileSync('sent_matches.json'));
    } catch (e) {
      console.error('⚠️ Failed to parse sent_matches.json:', e.message);
      previousSent = [];
    }
  }

  setInterval(() => {
    if (!fs.existsSync('match_results.json')) return;

    let matches;
    try {
      matches = JSON.parse(fs.readFileSync('match_results.json'));
    } catch (err) {
      console.error('❌ Failed to parse match_results.json:', err.message);
      return;
    }

    const newMatches = [];

    // ✅ Flatten matches into individual order-offer pairs with IDs
    matches.forEach(m => {
      m.matches.forEach(entry => {
        const id = `${m.order.number}_${m.order.timestamp}_${entry.offer.number}_${entry.offer.timestamp}`;
        if (!previousSent.includes(id)) {
          newMatches.push({
            order: m.order,
            offer: entry.offer,
            score: entry.score,
            id
          });
        }
      });
    });

    newMatches.forEach(async match => {
      const { order, offer, score, id } = match;

      const orderTime = new Date(order.timestamp).toLocaleString();
      const offerTime = new Date(offer.timestamp).toLocaleString();

      // ✅ Extract order/offer numbers for WhatsApp deep links
      const orderNumber = order.number || '';
      const offerNumber = offer.number || '';
      
      // ✅ Create clickable web app links to view message details
      const createWebAppLink = (messageType, messageData) => {
        if (!messageData.number) return '';
        
        // Create web app link that redirects to index.html with message details
        const webAppLink = `http://159.69.33.88:3000/index.html#${messageType}=${encodeURIComponent(messageData.number)}&timestamp=${encodeURIComponent(messageData.timestamp)}`;
        
        return webAppLink;
      };
      
      // ✅ Create clickable web app links
      const orderWebAppLink = createWebAppLink('order', order);
      const offerWebAppLink = createWebAppLink('offer', offer);

      // ✅ WhatsApp notification text with clickable web app links
      const text = 
`👜 *New Match Found!*

🔸 *ORDER*
📞 ${order.number} ${order.name ? `(${order.name})` : ''}
💬 ${order.message}
🌐 ${order.translated}
💰 Rs. ${order.price || 'N/A'}
🕐 ${orderTime}

🔗 *View Order:* ${orderWebAppLink}

🔸 *OFFER*
📞 ${offer.number} ${offer.name ? `(${offer.name})` : ''}
💬 ${offer.message}
🌐 ${offer.translated}
💰 Rs. ${offer.price || 'N/A'}
🕐 ${offerTime}

🔗 *View Offer:* ${offerWebAppLink}

🎯 *Match Score:* ${score}%

_Tap the links above to view message details in web app_
`;

      try {
        // ✅ Send notification to ALL connected numbers
        if (connectedNumbers.size === 0) {
          console.log(`⚠️ Skipping notification - No connected numbers in WhatsApp Manager`);
          return;
        }

        // Check if socket is properly initialized and connected
        if (!sock || !sock.user || !sock.user.id) {
          console.log(`⚠️ Skipping notification - WhatsApp socket not ready`);
          return;
        }
        
        console.log(`🔔 New match found, sending WhatsApp notification to ${connectedNumbers.size} connected numbers...`);
        
        // Send to all connected numbers
        const promises = Array.from(connectedNumbers).map(async (connectedNumber) => {
          try {
            // Extract clean phone number (remove session suffix after colon)
            const cleanNumber = connectedNumber.split(':')[0];
            await sock.sendMessage(`${cleanNumber}@s.whatsapp.net`, { text });
            console.log(`✅ Notification sent to ${cleanNumber}`);
          } catch (err) {
            console.error(`❌ WhatsApp send failed for ${connectedNumber}:`, err.message);
          }
        });
        
        await Promise.all(promises);
        previousSent.push(id);
        fs.writeFileSync('sent_matches.json', JSON.stringify(previousSent, null, 2));
      } catch (err) {
        console.error('❌ WhatsApp send failed:', err.message);
      }
    });

  }, 3000);
}

module.exports = { initialize };