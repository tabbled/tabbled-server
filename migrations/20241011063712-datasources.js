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
        "CREATE TABLE datasource (" +
        "id bigserial primary key," +
        "account_id int NOT NULL REFERENCES accounts(id) ON DELETE NO ACTION ON UPDATE CASCADE,"+
        "alias varchar(150)," +
        "title varchar(150)," +
        "type varchar(20)," +
        "is_system bool," +
        "is_tree bool," +
        "script text," +
        "context text," +
        "version int default 1," +
        "permissions jsonb not null default '{}'::json," +
        "created_at TIMESTAMP(3) default now()," +
        "created_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "updated_at TIMESTAMP(3) default now()," +
        "updated_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "deleted_at TIMESTAMP(3),"+
        "deleted_by int REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE," +
        "UNIQUE(account_id, alias)" +
        ");" +
        "ALTER TABLE datasource_fields ADD CONSTRAINT ds_fields FOREIGN KEY (datasource_id) REFERENCES datasource (id);" +
        "ALTER TABLE datasource_fields ADD UNIQUE(datasource_id, alias);"+
        "ALTER TABLE datasource_fields RENAME COLUMN required TO nullable;"
    )

    await populateDs(db)
    await populateFields(db)

};

const populateDs = async(db) => {
    let dss = await getDatasource(db)
    //console.log(dss)

    for (let i in dss) {
        let ds = dss[i]
        console.log(ds)
        let query = "INSERT INTO datasource (" +
            "id," +
            "account_id," +
            "alias," +
            "title," +
            "type," +
            "is_system,"+
            "is_tree," +
            "script," +
            "context," +
            "version," +
            "permissions," +
            "created_by," +
            "updated_by" +
            ") VALUES (" +
            `'${ds.id}', 
            1,
            '${ds.data.alias}', 
            '${ds.data.title}', 
            '${ds.data.source}', 
            false,
            ${!!ds.data.isTree }, 
            $1, 
            '${ds.data.context ? ds.data.context : ''}', 
            ${ds.version}, 
            ${ds.data.permissions ? "'" + JSON.stringify(ds.data.permissions) + "'::jsonb": "'{}'::jsonb"}, 
            ${ds.created_by}, 
            ${ds.updated_by})`
        await db.runSql(query, [ds.data.script])

    }
}

const getDatasource = async(db) => {
    return new Promise((resolve, reject) => {
        db.runSql("SELECT * FROM config WHERE alias = 'datasource' and deleted_at is null", (err, res) => {
            if (err) {
                reject(err)
                return
            }

            resolve(res.rows)
        })
    })
}

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
            "nullable," +
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
            `${field.nullable},` +
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
                        field.nullable = !!f.required
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

exports.down = async function(db) {
    await db.runSql(
        "ALTER TABLE datasource_fields RENAME COLUMN nullable TO required;" +
        "ALTER TABLE datasource_fields DROP CONSTRAINT ds_fields;" +
        "DROP TABLE IF EXISTS datasource;" +
        "DELETE FROM datasource_fields;")
};

exports._meta = {
  "version": 1
};
