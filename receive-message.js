const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Initialize the WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("auth_failure", (msg) => {
  console.error("Authentication failure:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out:", reason);
});

client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    console.log(`Message received in chat: ${chat.name}`);
    console.log(`Message sent by: ${contact.pushname || contact.number}`);
    console.log(`Message content: ${msg.body}`);
  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
});

client.initialize();
