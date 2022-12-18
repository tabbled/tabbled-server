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
        pages: []
    };
  }
}

// temp entities implementations
let mockEntities = [{
    id: 1,
    title: "Типы цен",
    alias: "price_types",
    is_tree: false,
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
    alias: "clients",
    is_tree: false,
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
