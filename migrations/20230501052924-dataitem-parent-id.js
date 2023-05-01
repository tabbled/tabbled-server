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
        "ALTER TABLE data_items ADD COLUMN IF NOT EXISTS parent_id bigint null;" +
        "ALTER TABLE revisions ADD COLUMN IF NOT EXISTS item_parent_id bigint null;")
};

exports.down = function() {
    return null;
};

exports._meta = {
    "version": 1
};
