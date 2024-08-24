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
        "DROP TABLE IF EXISTS datasource_fields;" +
        "CREATE TABLE datasource_fields (" +
        "id serial primary key," +
        "version int not null," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "datasource_id bigint NOT NULL," +
        "datasource_alias varchar(100) not null," +
        "alias varchar(100) not null,"+
        "type varchar(30) not null," +
        "title varchar(250) not null, " +
        "searchable bool not null," +
        "filterable bool not null," +
        "sortable bool not null," +
        "is_multiple bool not null default false," +
        "default_value varchar(1000)," +
        "datasource_ref varchar(100)," +
        "autoincrement bool default false," +
        "required bool default false," +
        "precision int default 0,"+
        "format varchar(100),"+
        "enum_values jsonb," +
        "created_at TIMESTAMP(3) default now()," +
        "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "updated_at TIMESTAMP(3) default now()," +
        "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "deleted_at TIMESTAMP(3),"+
        "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "UNIQUE(account_id, datasource_alias, alias))"
    );

    await populateFields(db)
};

const populateFields = async (db) => {
    let fields = await getFields(db)
    //console.log(fields)

        for (let i in fields) {
            let field = fields[i]
            let query = "INSERT INTO datasource_fields (" +
                "datasource_id," +
                "datasource_alias," +
                "alias," +
                "type," +
                "title," +
                "searchable," +
                "filterable," +
                "sortable," +
                "is_multiple," +
                "default_value," +
                "datasource_ref," +
                "autoincrement," +
                "required," +
                "precision," +
                "format," +
                "enum_values," +
                "created_by," +
                "updated_by," +
                "account_id," +
                "version) VALUES (" +
                `${field.datasource_id},` +
                `'${field.datasource_alias}',` +
                `'${field.alias}',` +
                `'${field.type}',` +
                `'${field.title}',` +
                `${field.searchable},` +
                `${field.filterable},` +
                `${field.sortable},` +
                `${field.is_multiple},` +
                `'${field.default_value}',` +
                `${field.datasource_ref ? "'" + field.datasource_ref + "'" : null },` +
                `${field.autoincrement},` +
                `${field.required},` +
                `${field.precision},` +
                `'${field.format}',` +
                `${ field.enum_values ? "'" + JSON.stringify(field.enum_values) + "'::jsonb": null},` +
                `${field.created_by},` +
                `${field.updated_by},` +
                `${field.account_id},` +
                `${field.version})`
            await db.runSql(query)
        }


}

const getFields = async(db) => {
    return new Promise((resolve, reject) => {
        db.runSql("SELECT * FROM config WHERE alias = 'datasource' and deleted_at is null", (err, res) => {
            if (err) {
                reject(err)
                return
            }


            let fields = []
            for(let i in res.rows) {
                let ds = res.rows[i]
                if (ds.data.fields) {
                    for(let j in ds.data.fields) {

                        let field = {
                            "datasource_id": ds.id,
                            "datasource_alias": ds.data.alias,
                            "account_id": 1
                        }
                        let f = ds.data.fields[j]
                        field.alias = f.alias
                        field.type = f.type
                        field.title = f.title
                        field.searchable = !!f.searchable
                        field.filterable = !!f.filterable
                        field.sortable = !!f.sortable
                        field.is_multiple = !!f.isMultiple
                        field.default_value = f.default ? f.default : ""
                        field.datasource_ref = f.datasource
                        field.autoincrement = !!f.autoincrement
                        field.required = !!f.required
                        field.enum_values = f.values
                        field.precision = f.precision ? f.precision : null
                        field.format = f.format ? f.format : ""
                        field.created_by = ds.created_by
                        field.updated_by = ds.updated_by
                        field.version = 1
                        fields.push(field)
                    }
                }
            }

            resolve(fields)
        })
    })
}

exports.down = function() {
  return null;
};

exports._meta = {
  "version": 1
};
