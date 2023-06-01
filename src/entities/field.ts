export type FieldComponentType = 'handler' | 'dataset' | 'datasource' | 'elements' | 'field'
export type FieldDataType = 'number' | 'string' | 'bool' | 'text' | 'list' | 'enum' | 'status' | 'image' | 'datetime' | 'date' | 'time' | 'link' | 'table'
export type FieldType = FieldComponentType | FieldDataType
export type FieldListOfType = 'dataset' | 'element' | 'column' | 'field' | 'action'

export type NumericFormatType = 'none' | 'decimal' | 'currency'
export type FormatType = NumericFormatType

export function getFieldDataTypes():Array<FieldDataType> {
    return [
        'number',
        'string',
        'bool',
        'text',
        //'list',
        'enum',
       // 'status',
        'image',
        'datetime',
        'date',
        'time',
        'link',
        'table'
    ]
}

export interface EventHandlerConfigInterface {
    type: 'script' | 'action'
    script?: string,
    action?: string
}

export interface EnumValuesInterface {
    key: string | number,
    title: string
}

export interface FieldConfigInterface {
    title: string,                      // Using in table and editor titles
    alias: string,                      // Using in calculations
    type: FieldType,
    tooltip?: string,
    required?: boolean,
    hidden?:boolean,
    listOf?: FieldListOfType
    keyProp?: string,
    displayProp?: string,
    link?: string,                      // Data source alias
    values?: EnumValuesInterface[],       // Only for types
    isMultiple?: boolean,
    isTree?:boolean,
    precision?: number,                  // Only for type numeric
    default?: any,
    datasource?: string  // Only for type Table, that can be passed a DataSourceConfig
    getValue?: string                    // Evaluate when entity changed, result of eval sets to field value
    getListValues?: string             // Evaluate when list or enum field gets values for dropdown menu
    setValue?: string             // Evaluate when value changed manually by user or by another script
    getReadonly?: string
    dataSetField?: string               // For 'field' type that used for looking fields list in set dataset on PageSettingPanel
    format?: FormatType, // // Only for string and number types
    autoincrement?: boolean, // Only for number type
    searchable?: boolean // Only for string and number types
}