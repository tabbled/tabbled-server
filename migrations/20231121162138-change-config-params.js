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
        "ALTER TABLE config_params DROP CONSTRAINT config_params_pkey;" +
        "ALTER TABLE config_params DROP COLUMN account_id;" +
        "ALTER TABLE config_params ADD CONSTRAINT config_params_pkey PRIMARY KEY (id)"
    );
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
