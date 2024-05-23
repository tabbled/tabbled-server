import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'
import { Context } from '../entities/context'

export class UpdateMessage {
    type: 'data' | 'config'
    context: Context
    entity: {
        alias: string
        id?: string
        data?: any
        rev: string
    }
    route?: string[]
    parent?: any
    action: 'add' | 'update' | 'remove'
}

@Injectable()
export class RoomsService {
    private server: Server = null
    constructor() {
        console.log('constructor.RoomsService')
    }

    setServer(server) {
        this.server = server
    }

    emitUpdates(message: UpdateMessage) {
        if (!this.server) {
            throw 'updateNotify. There is no socket server'
        }
        this.server.emit('updates', message)
    }
}
