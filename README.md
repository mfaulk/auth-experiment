
# auth-with-node

An experiment in creating an authenticated/authorized API backed by PostgreSQL.

# Prerequisites

- node
- bower
- grunt
- postgres

# Installation

## Postgres
Edit `server/config/config.json` to match your database environments.

```
npm install
bower install
cd server
../node_modules/.bin/sequelize db:migrate
```

