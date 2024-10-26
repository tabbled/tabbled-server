import {
    Injectable,
    ExecutionContext,
    HttpException,
    HttpStatus,
    NestInterceptor,
    CallHandler
} from "@nestjs/common";
import { Observable } from 'rxjs';
import { DataSourceV2Service } from "./datasourceV2.service";

@Injectable()
export class DataSourceInterceptor implements NestInterceptor {
    constructor(readonly dsService: DataSourceV2Service) {}
    async intercept(
        context: ExecutionContext,
        next: CallHandler

    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        let exists = await this.dsService.isExists(request.params['alias'], {
            accountId: request['accountId'],
            userId: request['userId']
        })

        if (!exists) {
            throw new HttpException(
                {
                    success: false,
                    statusCode: HttpStatus.NOT_FOUND,
                    error: `DataSource ${request.params['alias']} doesn't exist`
                }, HttpStatus.NOT_FOUND)
        }
        return next.handle()
    }
}
