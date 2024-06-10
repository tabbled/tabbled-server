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
        "DROP TABLE IF EXISTS item_viewing;" +
        "CREATE TABLE item_viewing (" +
        "item_id bigint NOT NULL REFERENCES data_items(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "user_id int NOT NULL REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "viewed_at TIMESTAMP(3) default now()," +
        "PRIMARY KEY(item_id, account_id, user_id))"
    );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
