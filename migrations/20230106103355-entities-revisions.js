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
    "DROP TABLE IF EXISTS data_items;" +
    "DROP TABLE IF EXISTS revisions;" +
    "DROP TYPE IF EXISTS data_item_type;" +
    "CREATE TYPE data_item_type AS ENUM ('config', 'data');" +
    "CREATE TABLE data_items (" +
    "id  bigint PRIMARY KEY," +
    "rev bigint," +
    "version int," +
    "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "alias varchar(100) NOT NULL," +
    "type data_item_type NOT NULL, " +
    "data jsonb not null default '{}'::json," +
    "created_at TIMESTAMP(3) default now()," +
    "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "updated_at TIMESTAMP(3) default now()," +
    "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "deleted_at TIMESTAMP(3),"+
    "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +
    ");"+
    "CREATE TABLE revisions (" +
    "id bigserial PRIMARY KEY," +
    "version int," +
    "item_id  bigint," +
    "alias varchar(100) NOT NULL," +
    "type data_item_type NOT NULL, " +
    "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "data jsonb not null default '{}'::json," +
    "created_at TIMESTAMP(3) default now()," +
    "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +
    ");"
  );
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
