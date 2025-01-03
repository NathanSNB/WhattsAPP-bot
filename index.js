const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const client = new Client();

let spamInterval; // Variable pour le spam

// Créer un stream pour écrire dans le fichier CSV
const logStream = fs.createWriteStream('messages.csv', { flags: 'a' });
logStream.write('Contenu, Qui, Chez Qui/Ou, Heure\n'); // Entête du fichier CSV

// Code QR pour la connexion à WhatsApp
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code reçu, scannez-le avec votre application WhatsApp.');
});

// Quand le client est prêt
client.on('ready', () => {
    console.log('Client WhatsApp prêt et connecté avec succès.');
});

// Quand un message est envoyé
client.on('message_create', (msg) => {
    try {
        // Loguer le message dans la console
        console.log(`NOUVEAU MESSAGE :
        Contenu: ${msg.body}
        Par qui ? : ${msg.from}
        Chez qui/ou ? : ${msg.to}
        Heure: ${new Date(msg.timestamp * 1000).toLocaleString()}`);

        // Loguer dans le fichier CSV
        logStream.write(`"${msg.body.replace(/"/g, '""')}", "${msg.from}", "${msg.to}", "${new Date(msg.timestamp * 1000).toLocaleString()}"\n`);
    } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
    }
});

// Quand un message est reçu
client.on('message', async (msg) => {
    try {
        // Vérifie si le message commence par la commande !spam
        if (msg.body.startsWith('!spam')) {
            const spamMessage = msg.body.substring(6).trim(); // Extrait le message après !spam
            if (spamMessage) {
                // Commence le spam du message dans le groupe
                console.log(`Démarrage du spam: "${spamMessage}" dans le groupe ${msg.to}`);
                
                spamInterval = setInterval(async () => {
                    await msg.reply(spamMessage);
                    console.log(`Message spamé: "${spamMessage}"`);
                }, 1000); // Envoie le message toutes les 1 seconde (1000ms)
            } else {
                await msg.reply('Veuillez spécifier un message après !spam.');
            }
        }

        // Vérifie si le message commence par la commande !stop
        if (msg.body === '!stop') {
            if (spamInterval) {
                clearInterval(spamInterval); // Arrête le spam
                console.log('Le spam a été arrêté.');
                await msg.reply('Le spam a été arrêté.');
            } else {
                await msg.reply('Aucun spam en cours.');
            }
        }

    } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
    }
});

// Quand le client est authentifié
client.on('authenticated', () => {
    console.log('Client authentifié avec succès.');
});

// Quand le client se déconnecte
client.on('disconnected', (reason) => {
    console.log(`Client déconnecté: ${reason}`);
});

// Démarrer le client WhatsApp
client.initialize();
