import { Injectable } from '@nestjs/common';
// import { CreateConfigurationDto } from './dto/create-configuration.dto';
// import { UpdateConfigurationDto } from './dto/update-configuration.dto';
//import { User } from "../users/entities/user.entity";
import { Configuration } from "./entities/configuration.entity"

@Injectable()
export class ConfigurationService {

  async getAll() : Promise<Configuration> {
    return {
        entities: mockEntities,
        tableModels: [],
        reportTemplates: []
    };
  }
}

// temp entities implementations
let mockEntities = [{
    id: 1,
    name: "Типы цен",
    is_tree: false,
    fields: [
        {
            "code": "name",
            "type": "string",
            "title": "Наименование",
            "default": "",
            "required": true,
            "is_system": true
        },
        {
            "code": "round",
            "type": "numeric",
            "title": "Округление",
            "default": "0",
            "decimals": 0
        },
        {
            "code": "discount",
            "type": "numeric",
            "title": "Скидка",
            "default": "0",
            "decimals": 2
        }
    ]
}, {
    id: 2,
    name: "Клиенты",
    is_tree: false,
    fields: [
        {
            "code": "name",
            "type": "string",
            "title": "Name",
            "default": "",
            "required": true,
            "is_system": true
        },
        {
            "code": "phone",
            "type": "string",
            "title": "Телефон"
        },
        {
            "code": "Email",
            "type": "string",
            "title": "Email"
        },
        {
            "code": "city",
            "type": "string",
            "title": "City"
        },
        {
            "code": "address",
            "type": "string",
            "title": "Address"
        }
    ]
}]
