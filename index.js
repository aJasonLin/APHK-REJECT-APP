
import fs from 'fs';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { run } from './aws_S3/S3.js';
import { arrange } from './handleCSV.js';
import { CheckInMemo } from './handleMemo.js';
import * as dotenv from 'dotenv'
dotenv.config()

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly"
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.promises.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.promises.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient, folderId, mimeType, pageSize) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = '${mimeType}'`,
        orderBy: "createdTime desc",
        pageSize,
        fields: 'nextPageToken, files(id, name)',
    });
    const files = res.data.files;
    if (files.length === 0) {
        console.log('No files found.');
        return;
    }

    console.log('Files:');
    files.map((file) => {
        console.log(`${file.name} (${file.id})`);
    });
    return files
}

async function exportCSV(authClient, fileId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const params = {
        fileId,
        mimeType: 'text/csv',
    }
    const res = await drive.files.export(params);
    return res.data
}

const saveAsCsv = (csv, fileName) => {
    fs.writeFile(`./output/${fileName}`, csv, err => {
        if (err) {
            console.error(err);
        }
        // file written successfully
    });
}

const fileGet = async (authClient, fileId) => {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const params = {
        fileId,
        alt: "media"
    }
    const res = await drive.files.get(params)
    return res.data

}
// authorize().then((client)=>fileGet(client,"16_BI7sW55YGUF3vdibvy8krha-x7NMbW")).then(arange)
// .then((res)=>{

// })
// .catch(console.error);
// authorize().then((client) => exportCSV(client, "1tFnRsy_2g6lNnVDUlkbCNJXaHWWf_rrwIczx062DtvA")).then(saveAsCsv).catch(console.error)
const main = async () => {
    const client = await authorize();
    const folder = (await listFiles(client, process.env.DRIVE_FOLDER_ID, 'application/vnd.google-apps.folder', '1'))[0]
    let files = await listFiles(client, folder.id, 'text/csv', "100")
    files = await CheckInMemo(files,folder)
    if (files) {
        files.map(async (file) => {
            const csv = await fileGet(client, file.id);
            const csvArranged = arrange(csv)
            Object.entries(csvArranged).forEach((obj) => {
                if (obj[1].split("\n").length > 1) {
                    saveAsCsv(obj[1], obj[0] + "_" + file.name)
                }

            })
        })
        console.log("Uploading to S3")
        fs.readdir("output", (err, files) => {
            files.forEach(async (file) => {
                const bucketParams = {
                    Bucket: process.env.BUCKET_NAME,
                    // Specify the name of the new object. For example, 'index.html'.
                    // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
                    Key: `${(file.split('_'))[0]}/${file}`,
                    // Content of the new object.
                    Body: fs.createReadStream(`./output/${file}`),
                };
                await run(bucketParams).then(console.log(`./output/${file}.csv --Successful`)).catch((e) => console.log(e));
            });
        })
    }
}
main()