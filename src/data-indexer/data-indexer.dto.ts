import { Context } from "../entities/context";
import { DataSourceConfigInterface } from "../datasources/entities/datasource.entity";

export class DataIndexJob {
    context: Context
    datasource: DataSourceConfigInterface
    ids?: string[]
}