To run:

1. update the .env files
2. npm build || npm run dev

You might need to update the .env file depending on what port you serve on from dev, dev creates it's own certs for https.

You will also need to put in the IMS_USERNAME & \_PASSWORD to run the e2e tests.

To run the tests run

```
npx cypress open
```

To format prettier . --write
