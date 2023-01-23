simple bot to track for if a Jellycat item is in stock

the following are the environment variables for the
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
VERIFY_PHONE_NUMBER
MONITOR_URLS

- the urls are separate by commas (,), and will create individual cron job for every url

* after the item in stock is trigger the cron job will end and a text message will be sent to the verified phone number to alert the user about the item in stock
