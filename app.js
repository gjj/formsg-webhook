const express = require('express')
const formsg = require('@opengovsg/formsg-sdk')()
const request = require('request')
var { google } = require('googleapis')

const app = express()
let sheets = google.sheets('v4');

const FORM_SECRET_KEY = process.env.FORM_SECRET_KEY
const POST_URI = process.env.POST_URI // Should match the URI supplied to FormSG in the form dashboard
const GOOGLE_SERVICE_ACCOUNT = require('./opencerts-service-account.json')

const spreadsheetId = '1nhhD3XvHh2Ql_hW27LNw01fC-_I6Azt_XzYiYGhkmAU'
const range = '\'Form responses\'!A:I'

const jwtClient = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT.client_email,
  null,
  GOOGLE_SERVICE_ACCOUNT.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);
jwtClient.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Successfully connected!");
  }
});

app.post(
  '/submissions',
  // Endpoint authentication by verifying signatures
  function (req, res, next) {
    try {
      formsg.webhooks.authenticate(req.get('X-FormSG-Signature'), POST_URI)
      // Continue processing the POST body
      return next()
    } catch (e) {
      return res.status(401).send({ message: 'Unauthorized' })
    }
  },
  // Parse JSON from raw request body after successful authentication
  express.json(),
  // Decrypt the submission
  function (req, res, next) {
    // `req.body.data` is an object fulfilling the DecryptParams interface.
    // interface DecryptParams {
    //   encryptedContent: EncryptedContent
    //   version: number
    //   verifiedContent?: EncryptedContent
    // }
    /** @type {{responses: FormField[], verified?: Record<string, any>}} */
    const submission = formsg.crypto.decrypt(
      FORM_SECRET_KEY,
      // If `verifiedContent` is provided in `req.body.data`, the return object
      // will include a verified key.
      req.body.data
    )

    // If the decryption failed, submission will be `null`.
    if (submission) {
      // Continue processing the submission
      // console.log(submission);

      const documentStore = submission.responses[1].answer
      console.log(documentStore)
      const request = {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'OVERWRITE',
        resource: {
          values: [
            [
              documentStore
            ]
          ]
        }
      }
      try {
        var response = sheets.spreadsheets.values.append(request)
        console.log(JSON.stringify(response, null, 2));
      } catch (err) {
        console.log(err);
      }
    } else {
      // Could not decrypt the submission
    }
  }
)

app.listen(8080, () => console.log('Running on port 8080'))