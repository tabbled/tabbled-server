import {
    Injectable,
    ExecutionContext,
    HttpException,
    HttpStatus,
    NestInterceptor,
    CallHandler
} from "@nestjs/common";
import { Observable } from 'rxjs';
import { DataSourceConfigInterface } from "./entities/datasource.entity";
import { DataSourceV2Service } from "./datasourceV2.service";

@Injectable()
export class DataSourceInterceptor implements NestInterceptor {
    constructor(readonly dsService: DataSourceV2Service) {}
    async intercept(
        context: ExecutionContext,
        next: CallHandler

    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        let config: DataSourceConfigInterface = await this.dsService.getConfigByAlias(request.params['alias'])

        if (!config) {
            throw new HttpException(
                {
                    success: false,
                    statusCode: HttpStatus.NOT_FOUND,
                    error: `DataSource1 ${request.params['alias']} is not exists`
                }, HttpStatus.NOT_FOUND)
        }
        let req = context.switchToHttp().getRequest()
        req['datasource.config'] = config
        return next.handle()
    }
}
