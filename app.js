const express = require("express")
const formsg = require("@opengovsg/formsg-sdk")()
const request = require("request")

const app = express()

const FORM_SECRET_KEY = process.env.FORM_SECRET_KEY
const POST_URI = process.env.POST_URI // Should match the URI supplied to FormSG in the form dashboard
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

const spreadsheetId = "1nhhD3XvHh2Ql_hW27LNw01fC-_I6Azt_XzYiYGhkmAU"
const range = "'Form responses'!A:I"

app.post(
  "/submissions",
  // Endpoint authentication by verifying signatures
  function (req, res, next) {
    try {
      formsg.webhooks.authenticate(req.get("X-FormSG-Signature"), POST_URI)
      // Continue processing the POST body
      return next()
    } catch (e) {
      return res.status(401).send({ message: "Unauthorized" })
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
      // can't use api key here...
      request.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?key=${GOOGLE_API_KEY}&valueInputOption=RAW&insertDataOption=OVERWRITE`, {
        json: {
          values: [
            [
              documentStore
            ]
          ]
        }
      }, (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
      })
    } else {
      // Could not decrypt the submission
    }
  }
)

app.listen(8080, () => console.log("Running on port 8080"))