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
    "ALTER TABLE data_items DROP COLUMN type;" +
    "ALTER TABLE revisions DROP COLUMN type;" +
    "DROP TYPE IF EXISTS data_item_type;" +
    "DROP TABLE IF EXISTS config;" +
    "DROP TABLE IF EXISTS config_revisions;" +
    "CREATE TABLE config (" +
    "id  bigint PRIMARY KEY," +
    "rev bigint," +
    "version int," +
    "alias varchar(100) NOT NULL," +
    "data jsonb not null default '{}'::json," +
    "created_at TIMESTAMP(3) default now()," +
    "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "updated_at TIMESTAMP(3) default now()," +
    "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
    "deleted_at TIMESTAMP(3),"+
    "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +
    ");"+
    "CREATE TABLE config_revisions (" +
    "id bigserial PRIMARY KEY," +
    "version int," +
    "item_id  bigint," +
    "alias varchar(100) NOT NULL," +
    "data jsonb not null default '{}'::json," +
    "created_at TIMESTAMP(3) default now()," +
    "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +
    ");")
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
