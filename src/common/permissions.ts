export function hasPermissionV1(entity, action: string, userPermissions: any) {
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

export function hasPermissionV2(itemPermissions: PermissionDto, action: string, userPermissions: any) {
    if (userPermissions.admin)
        return true;

    if (!itemPermissions)
        return true


    let perm = itemPermissions[action]

    if (perm === undefined)
        return true

    switch (perm.type) {
        case 'all': return true;
        case 'nobody': return false;
        case 'roles':
            return perm.roles.some(r=> userPermissions.roles.includes(r))
        default: return false
    }
}

export type PermissionDto = {
    [key in string]: {
        type: 'all' | 'roles' | 'nobody',
        roles: string[]
    }
}