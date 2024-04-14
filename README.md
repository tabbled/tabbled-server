## Tabbled server
It is a self-hosted low-code platform, part of the project.

Look for more information on [this page](https://github.com/tabbled/tabbled)

## ⭐ Features

* Stores account data and configuration:
  * Entity configuration
  * Entity data
  * Js models
  * report templates
* Renders jsreport templates
* Communicates with web app through WebSecket

## Dependencies

* PostgreSQL
* [jsReport](https://jsreport.net/)
* Minio
* Redis

## Installation

```bash
$ npm install
$ npm install -g db-migrate 
```

## Running the app

```bash
# after all you need to actualize database schema
$ db-migrate up

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Tabbled is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. 

If you love this project, please consider giving a ⭐.
    
## License

[MIT](https://github.com/tabbled/tabbled-server/LICENSE)
