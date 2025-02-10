const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const fastcsv = require("fast-csv");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("ready", async () => {
  console.log("Client is ready!");

  const chats = await client.getChats();
  const contacts = chats.map((chat) => ({
    group: chat.name,
  }));

  const ws = fs.createWriteStream(
    path.resolve(__dirname, "downloaded_contacts.csv")
  );
  fastcsv.write(contacts, { headers: true }).pipe(ws);

  console.log("Contacts downloaded successfully.");
  await client.destroy();
  process.exit(0);
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

client.initialize();
