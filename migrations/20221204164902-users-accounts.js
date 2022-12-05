'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function(db) {
    await db.runSql(
      "DROP TABLE IF EXISTS account_users;" +
      "DROP TABLE IF EXISTS accounts;" +
      "DROP TABLE IF EXISTS users;" +
      "CREATE TABLE users (" +
      "id serial PRIMARY KEY," +
      "username varchar(100) NOT NULL," +
      "firstname varchar(100)," +
      "lastname varchar(100)," +
      "password varchar(200) NOT NULL," +
      "settings jsonb," +
      "created_at TIMESTAMP(3) default now()," +
      "updated_at TIMESTAMP(3) default now()," +
      "UNIQUE(username)" +
      ");"  +
      "CREATE TABLE accounts (" +
      "id serial NOT NULL primary key," +
      "name varchar(100) NULL," +
      "created_at timestamp(3) NOT NULL DEFAULT now()," +
      "updated_at timestamp(3) NOT NULL DEFAULT now() " +
      ");" +
      "CREATE TABLE account_users (" +
      "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
      "user_id int NOT NULL REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
      "activated bool default true NOT NULL,"+
      "invited_at timestamp(3) null," +
      "invite_accepted_at timestamp(3) null," +
      "permissions jsonb not null default '{}'::json," +
      "active bool default true NOT NULL," +
      "invite_uid varchar(100)," +
      "PRIMARY KEY (account_id, user_id)" +
      ");"
    );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
