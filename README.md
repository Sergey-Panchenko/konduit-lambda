# konduit web server

### Installation

```
npm install
```

### Building react application
###### Static assets will appear in /dist folder

```
npm run build-react
```

### Running the application server (requires npm run build-react)
###### will run on http://localhost:3333

```
npm start
```

### Running the application server with webpack dev server
###### will run on http://localhost:3333.
You need to have DynamoDB server running on your local machine and available on DYNAMODB_ENDPOINT from the config.
http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.html
Also you have to create the table with DYNAMODB_RESULTS_TABLE name from the config.

```
npm run start-dev
```

### Running the tests

```
npm test
```

### Running the code coverage report

```
npm run cover
```

### Heapdump

For debugging purpose you can take a memory heap dump by launching:

```
kill -USR2 <pid>
```

See: [node-heapdump](https://github.com/bnoordhuis/node-heapdump)
