# formsg-webhook
This provides an example of how you can send [FormSG](https://form.gov.sg/) data to Google Sheets through a webhook.

## Usage

To run,

```
FORM_SECRET_KEY=<your given secret key> POST_URI=<location of your webhook>/submissions node app
```

You also need to have a Google service account. Don't have one? You can create it in the [Credentials](https://console.cloud.google.com/apis/credentials) page within Google Cloud Console.
