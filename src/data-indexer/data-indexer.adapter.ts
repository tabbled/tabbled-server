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
}