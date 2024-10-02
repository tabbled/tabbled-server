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
        "DROP TABLE IF EXISTS pages;" +
        "CREATE TABLE pages (" +
        "id serial primary key," +
        "alias varchar(150)," +
        "title varchar(150)," +
        "type varchar(20)," +
        "version int default 1," +
        "permissions jsonb not null default '{}'::json," +
        "datasets jsonb not null default '[]'::json," +
        "elements jsonb not null default '[]'::json," +
        "header_actions jsonb not null default '[]'::json," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE,"+
        "created_at TIMESTAMP(3) default now()," +
        "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "updated_at TIMESTAMP(3) default now()," +
        "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "deleted_at TIMESTAMP(3),"+
        "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "UNIQUE(account_id, alias)" +
        ")"
    )
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
