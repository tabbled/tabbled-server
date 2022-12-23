import { Injectable } from '@nestjs/common';
// import { CreateConfigurationDto } from './dto/create-configuration.dto';
// import { UpdateConfigurationDto } from './dto/update-configuration.dto';
//import { User } from "../users/entities/user.entity";
import { Configuration } from "./entities/configuration.entity"

@Injectable()
export class ConfigurationService {

  async getAll() : Promise<Configuration> {
    return {
        dataSources: mockEntities,
        pages: mockPages,
        sidebarMenu: mockMenu
    };
  }
}

//temp pages
let mockPages = [
    {
        alias: 'customers',
        title: 'Customers',
        path: '/customers',
        type: "list",
        dataSourceAlias: 'customers',
        layout: {
            large: [
                {
                    position: {
                        colFrom: 1,
                        colTo: 13,
                        rowFrom: 1,
                        rowTo: 10,
                    },
                    type: "field",
                    title: "1",
                    icon: "table",
                    alias: "aaa"
                },
                {
                    position: {
                        colFrom: 1,
                        colTo: 7,
                        rowFrom: 2,
                        rowTo: 2,
                    },
                    type: "field",
                    title: "Field 1199922",
                    icon: "filter",
                    alias: "11sd"
                },{
                    position: {
                        colFrom: 7,
                        colTo: 13,
                        rowFrom: 3,
                        rowTo: 5
                    },
                    type: "field",
                    title: "1",
                    icon: "table",
                    alias: "aaa"
                }
            ],
            small: []
        }
    },
    {
        alias: 'pagesList',
        title: 'Pages',
        path: '/configuration/pages',
        type: "list",
        dataSourceAlias: 'pages',
        layout: {
            large: [
                {
                    position: {
                        colFrom: 1,
                        colTo: 13,
                        rowFrom: 1,
                        rowTo: 1
                    },
                    component: {
                        name: 'Table',
                        properties: {
                            dataSource: 'pages',
                        }
                    },

                }
            ],
            small: []
        }
    }
]

//temp menu
let mockMenu = [
    {
        id: "1",
        page: "111",
        title: "Products",
        path: "/products",
        icon: "file-cabinet"
    },
    {
        id: "2",
        page: "0004",
        title: "Customers",
        path: "/customers",
        icon: "user"
    },
    {
        id: "config",
        title: 'configuration',
        icon: 'application-brackets-outline',
        items: [
            {
                id: "pages",
                title: 'Pages',
                path: `/configuration/pages`,
                page: 'configuration/pages'
            },
            {
                id: "models",
                title: 'Table models',
                path: `/configuration/models`,
                page: 'modelsList'
            },
            {
                id: "templates",
                title: 'Report templates',
                path: `/configuration/report-templates`,
                page: "templatesList"
            },
        ]
    }
]


// temp entities implementations
let mockEntities = [{
    id: 1,
    title: "Типы цен",
    alias: "price_types",
    is_tree: false,
    type: "entity",
    fields: [
        {
            "alias": "name",
            "type": "string",
            "title": "Наименование",
            "default": "",
            "required": true,
            "is_system": true
        },
        {
            "alias": "round",
            "type": "numeric",
            "title": "Округление",
            "default": "0",
            "decimals": 0
        },
        {
            "alias": "discount",
            "type": "numeric",
            "title": "Скидка",
            "default": "0",
            "decimals": 2
        }
    ]
}, {
    id: 2,
    title: "Клиенты",
    alias: "customers",
    is_tree: false,
    type: "entity",
    fields: [
        {
            "alias": "name",
            "type": "string",
            "title": "Name",
            "default": "",
            "required": true,
            "is_system": true
        },
        {
            "alias": "phone",
            "type": "string",
            "title": "Телефон"
        },
        {
            "alias": "Email",
            "type": "string",
            "title": "Email"
        },
        {
            "alias": "city",
            "type": "string",
            "title": "City"
        },
        {
            "alias": "address",
            "type": "string",
            "title": "Address"
        }
    ]
}]
