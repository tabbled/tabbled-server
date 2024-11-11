export function hasPermissionV1(entity, action: string, userPermissions: any) {
    console.log(entity, action, userPermissions)
    if (userPermissions.admin)
        return true;

    if (!entity.permissions)
        return true

    let t = 'can' + action
    let perm = entity.permissions[t]

    if (perm === undefined)
        return true

    switch (perm) {
        case 'all': return true;
        case 'nobody': return false;
        case 'roles':
            return entity.permissions[`can${action}Roles`].some(r=> userPermissions.roles.includes(r))
        default: return false
    }
}