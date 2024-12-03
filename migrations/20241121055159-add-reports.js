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
        "CREATE TABLE reports (" +
        "id bigserial primary key," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "title varchar(150)," +
        "parameters jsonb not null default '[]'::json, "+
        "datasets jsonb not null default '[]'::json, "+
        "description varchar(250)," +
        "template_type varchar(20)," +
        "postprocessing text," +
        "page_settings jsonb default '{}'::json," +
        "pages jsonb default '[]'::json," +
        "html text," +
        "version int default 1," +
        "permissions jsonb not null default '{}'::json," +
        "created_at TIMESTAMP(3) default now()," +
        "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "updated_at TIMESTAMP(3) default now()," +
        "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "deleted_at TIMESTAMP(3)," +
        "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE" +
        ");"
    )
}

exports.down = async function(db) {
    await db.runSql(
        "DROP TABLE IF EXISTS reports"
    )
};

exports._meta = {
  "version": 1
};
