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
        "DROP TABLE IF EXISTS variables;" +
        "CREATE TABLE variables (" +
        "name varchar(100)," +
        "value text," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE,"+
        "created_at TIMESTAMP(3) default now()," +
        "updated_at TIMESTAMP(3) default now()," +
        "primary key(account_id, name))"
    )
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
