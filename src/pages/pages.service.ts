import { Injectable } from '@nestjs/common';
import { Context } from "../entities/context";
import { PageInterface } from "./dto/pages.dto";

@Injectable()
export class PagesService {
    constructor(/*@InjectDataSource('default')
                private datasource: DataSource,
                private eventEmitter: EventEmitter2*/) {
    }

    async getMany(context: Context) {
        console.log(context)
        return pagesMock
    }

    async getOneByAlias(alias: string, context: Context) {
        console.log(context)
        return pagesMock.find(i => i.alias === alias)
    }
}

let pagesMock: PageInterface[] = [
    {
        id: "1626752318806429696",
        alias: "suppliers",
        title: "Поставщики eee",
        type: "list",
        permissions: {
            "access": "all"
        },
        datasets: [{
            alias: "products",
            datasource: "products"
        },{
            alias: "resources",
            datasource: "resources"
        }],
        elements: [
            {
                id: "1770776988399702016",
                componentName: "TableV2",
                colSpan: 12,
                properties: {
                    title: "Поставщики",
                    dataset: "products",
                    height: 500
                }
            }
        ],
        headerActions: []
    }
]
