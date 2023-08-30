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
        "DROP TABLE IF EXISTS aggregation_movement; " +
        "DROP TABLE IF EXISTS aggregation_history; " +
        "CREATE TABLE aggregation_movement (" +
        "id bigserial PRIMARY KEY," +
        "issuer_id bigint," +
        "target_datasource varchar(150) not null," +
        "source_datasource varchar(150) not null," +
        "target_keys jsonb," +
        "source_keys jsonb," +
        "target_values jsonb," +
        "source_values jsonb," +
        "created_at  TIMESTAMP(3) default now());" +
        "CREATE TABLE aggregation_history (" +
        "id bigserial PRIMARY KEY," +
        "issuer_id bigint," +
        "datasource varchar(150) not null," +
        "keys jsonb," +
        "values jsonb," +
        "created_at  TIMESTAMP(3) default now())"
    )
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
