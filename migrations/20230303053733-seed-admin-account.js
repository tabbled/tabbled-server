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

exports.up = function(db) {
  db.insert('accounts', ['id','name'], [1, 'tabbled admin'])
  db.insert('users', ['id','username', 'password'], [1, 'admin', '$2a$12$4ydG4nRVQbH6FkDNeqyzweZl8mAtYrjifCIygyeDneg4VcCXO62Ey'])
  db.insert('account_users', ['account_id','user_id', 'active', 'permissions'], [1, 1, true, '{"admin": true}'])
  return null;
};

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
