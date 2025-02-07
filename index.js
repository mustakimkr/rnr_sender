const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const fastcsv = require("fast-csv");
const readline = require("readline");

// Initialize the WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Function to load contacts from CSV
const loadContactsFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const contacts = [];
    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        const { group, phoneNumber } = row;
        if (group) {
          contacts.push(group);
        } else if (phoneNumber) {
          contacts.push(`${phoneNumber}@c.us`);
        }
      })
      .on("end", () => resolve(contacts));
  });
};

// Function to prompt user for a message
const promptMessage = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Enter the message to send: ", (message) => {
      rl.close();
      resolve(message);
    });
  });
};

client.on("ready", async () => {
  try {
    console.log("Client is ready!");

    // Load contacts from CSV
    const contactsFilePath = path.resolve(__dirname, "contacts.csv");
    const contactList = await loadContactsFromCSV(contactsFilePath);

    // Prompt user for the message
    const message = await promptMessage();
    if (!message) {
      console.error("No message provided.");
      return;
    }

    // Fetch all chats (individuals & groups)
    const chats = await client.getChats();

    for (const chat of chats) {
      if (
        contactList.includes(chat.name) ||
        contactList.includes(chat.id._serialized)
      ) {
        await chat.sendMessage(message);
        console.log(`Message sent to ${chat.name}`);

        await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for 5 seconds before sending the next message
      }
    }

    // Wait for 2 seconds before closing the client
    console.log("All messages sent. Closing the client...");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error during message sending:", error);
    process.exit(1);
  }
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
