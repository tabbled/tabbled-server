import { Context } from "../entities/context";
import { DataSourceV2Dto } from "../datasources/dto/datasourceV2.dto";

export class DataIndexJob {
    context: Context
    datasource: DataSourceV2Dto
    ids?: string[]
}

