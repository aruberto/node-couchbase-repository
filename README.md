#realtor

This project serves realtor person and company data

##Requirements
* node __^7.0.0__
* npm __^3.0.0__

##Installation
```
git clone git@gitsub.solidifi.com:rmtech-title/realtor.git
npm install
```

##Features
* [koa2](https://github.com/koajs/koa)
* [koa-router](https://github.com/alexmingoia/koa-router)
* [koa-bodyparser](https://github.com/koajs/bodyparser)
* [koa-logger](https://github.com/koajs/logger)
* [couchbase-promises](https://github.com/dsfields/couchbase-promises/blob/master/README.md)
* [yup](https://github.com/jquense/yup/blob/master/README.md)
* [Nodemon](http://nodemon.io/)
* [Mocha](https://mochajs.org/)
* [Babel](https://github.com/babel/babel)
* [ESLint](http://eslint.org/)

##Structure
```
├── bin
│   └── server.js                  # Bootstrapping and entry point
├── config
│   ├── env
│   │   ├── <environment name>.js  # Environment specific config
│   ├── index.js                   # Server configuration settings - exports config according to envionrment and commons
├── src
│   ├── routes
│   │   ├── <route name>.js        # Domain specific routes
│   │   └── index.js               # App routes
│   ├── repository
│   │   └── <repository name>.js   # Domain data repositories
└── test                           # Unit tests
```

##Usage
* `npm start` Start server on live mode
* `npm run dev` Start server on dev mode with nodemon
* `npm test` Run mocha tests
* `npm run lint` Run eslint checks

##License
MIT
