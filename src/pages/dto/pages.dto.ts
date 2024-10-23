export class ResponseDto {
    statusCode: number
    error?: string
    message?: string[]
}

export type AccessType = 'all' | 'roles' | 'nobody'
export enum Access {
    'canView' = 'canView'
}

export class PageInterface {
    id: string
    alias: string
    title: string
    elements: ElementInterface[]
    headerActions: PageActionInterface[]
    permissions: {
        [key in Access]: {
            type: AccessType
            roles?: string[]
        }
    }
    type: 'edit' | 'list' | 'dashboard' | 'select'
    datasets: {
       alias: string,
       datasource: string
    }[]
}

export class PageActionInterface {

}


export class ElementInterface {
    id: string
    componentName: string
    properties: any
    colSpan: number
}

export class GetManyResponseDto extends ResponseDto {
    pages?: PageInterface[]
}

export class GetByAliasResponseDto extends ResponseDto {
    page?: PageInterface
}
