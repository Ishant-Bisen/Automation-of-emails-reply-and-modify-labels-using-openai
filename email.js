const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const open = require('esm')
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Load credentials from file
async function loadCredentials() {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');  
  return JSON.parse(content);
}

// Load or request authorization to call APIs
async function authorize() {
  const credentials = await loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

// get function to get the subject.
async function getMessageSubject(messageDetails) {
    const headers = messageDetails.data.payload.headers;
    for (let header of headers) {
        if (header.name === 'Subject') {
            return header.value;
        }
    }
    return ''; // Return empty string if subject not found
}


// Get and store new token after prompting for user authorization
async function listMessages(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000*12); 
    const oneHourAgoSec = Math.floor(oneHourAgo.getTime() / 1000);
    let messagesReceivedOneHourAgo = [];
  
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${oneHourAgoSec}`,
      maxResults: 100, // Adjust as needed
    });
    const messages = res.data.messages;
    if (messages && messages.length > 0) {
      // Retrieve details for each message
      for (const message of messages) {
        const messageId = message.id;
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });
        // console.log(messageDetails);
       // Construct message object and push to array
        const formattedMessage = {
            id: messageDetails.data.id,
            threadId : messageDetails.data.id, 
            subject: await getMessageSubject(messageDetails),
            snippet: messageDetails.data.snippet,
            labels: messageDetails.data.labelIds,
        };
        messagesReceivedOneHourAgo.push(formattedMessage);
        
      
    }
    // console.log(messagesReceivedOneHourAgo);
    return messagesReceivedOneHourAgo;
  }
} 
async function  ModifyEmailLabels(auth,messageId,labelToAdd){
  try{
      const gmail = google.gmail({ version: 'v1', auth });
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      // Modify labelIds to add the new label
      const currentLabels = message.data.labelIds || [];
      const newLabels = [...new Set([...currentLabels, labelToAdd])]; // Ensure no duplicate labels

      // Modify the message with the new labelIds
      const modifiedMessage = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: newLabels
        }
      });

      console.log('Modified message:', modifiedMessage.data);

    } catch (error) {
      console.error('Error modifying message labels:', error);
    }

}
// driver for the main functional methods. Caller methods. Define to make the methods awaits
const getEmails = async(auth)=>{
    try {
        const messages = await listMessages(auth);
        return messages
    } catch (error) {
        console.log({error:error});
        return error
    }
}

const addLabels = async(auth,messageId,labelToAdd)=>{
  try {
    const labels = await ModifyEmailLabels(auth,messageId,labelToAdd);
    return labels 
  } catch (error) {
    console.log({error:error});
    return error
  }
}

module.exports = {getEmails,authorize, addLabels};
