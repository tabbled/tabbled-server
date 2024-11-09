import { DataSource } from "typeorm";
import { MeiliSearch } from "meilisearch";
import { Context } from "../entities/context";
import { DataSourceV2Dto } from "../datasources/dto/datasourceV2.dto";

export abstract class IndexerDataAdapter {
    protected constructor(dataSource: DataSource,  searchClient: MeiliSearch) {
        this.dataSource = dataSource
        this.searchClient = searchClient
    }
    protected readonly dataSource: DataSource
    protected readonly searchClient: MeiliSearch

    abstract getData(ds: DataSourceV2Dto, context: Context,  ids?: string[]) : Promise<any[]>

    prepareTree(docs) {
        //console.log(docs)
        for(let i in docs) {
            let doc = docs[i]
            //console.log(doc)
            let route = []
            if (doc.parent_id === '')
                doc.parent_id = null

            doc.route = getRoute(doc, route)
            doc.has_children = docs.findIndex(f => doc.id === f.parent_id) >= 0
        }

        function getRoute(doc, route) : string[] {
            if (doc && doc.parent_id) {
                route.push(doc.parent_id)
                return getRoute(docs.find(f => f.id === doc.parent_id), route)
            } else {
                return route
            }
        }
    }
}