import {
    CanActivate,
    ExecutionContext,
    Injectable
} from "@nestjs/common";
import { Observable } from "rxjs";


@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const client = context.getArgByIndex(0);

        if (!client['accountId'] || !client['userId']) {
            console.error("No accountId or userId, accountId =", client['accountId'], ", userId = ", client['userId'])
            return false
        }

        return true
    }
}