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
import { DataSourceV2Dto } from "./dto/datasourceV2.dto";

@Injectable()
export class DataSourceInterceptor implements NestInterceptor {
    constructor(readonly dsService: DataSourceV2Service) {}
    async intercept(
        context: ExecutionContext,
        next: CallHandler

    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        console.log()
        let config: DataSourceV2Dto = await this.dsService.getConfigByAlias(request.params['alias'])

        if (!config) {
            throw new HttpException(
                {
                    success: false,
                    statusCode: HttpStatus.NOT_FOUND,
                    error: `DataSource ${request.params['alias']} doesn't exist`
                }, HttpStatus.NOT_FOUND)
        }
        let req = context.switchToHttp().getRequest()
        req['datasource.config'] = config
        return next.handle()
    }
}
