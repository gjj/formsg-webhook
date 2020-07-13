const express = require("express")
const formsg = require("@opengovsg/formsg-sdk")()

const app = express()

const formSecretKey = process.env.FORM_SECRET_KEY
const googleApiKey = process.env.GOOGLE_API_KEY
// Should match the URI supplied to FormSG in the form dashboard
const POST_URI = process.env.POST_URI

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
      formSecretKey,
      // If `verifiedContent` is provided in `req.body.data`, the return object
      // will include a verified key.
      req.body.data
    )

    // If the decryption failed, submission will be `null`.
    if (submission) {
      // Continue processing the submission
      console.log(submission);

      const documentStore = submission.responses[1].answer
      console.log(documentStore);
      
    } else {
      // Could not decrypt the submission
    }
  }
)

app.listen(8080, () => console.log("Running on port 8080"))