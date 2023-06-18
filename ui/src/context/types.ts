export interface ICredential {
    credentialKey: string
    value: string
    isHidden: boolean
}

export type DBDialect = 'postgres' | 'mysql' | 'mariadb';

export interface IDatabaseDisplay {
    _id: string
    name: string
    dialect: DBDialect
    credentials: ICredential[]
}

export interface IGrizzyDBGlobalState {
    user_fingerprint: string | null
    active_database: number
    databases: IDatabaseDisplay[]
}

export type ActionType = string

export interface IAction {
    type: ActionType
    payload?: any
}

export interface IDatabase {
    dialect: DBDialect,
    logo: string
    enabled: boolean
}

export interface ISampleTemplate {
    dialect: DBDialect;
    name: string
    sql_statements: string
}

export type Template = 'custom' | 'sample' | 'none'

export interface IDatabaseTemplate {
    dialect: DBDialect;
    selected_template: Template;
    sample_data_template: string;
    custom_schema_template: string;
}

export interface IDBQuery {
    query: string
    mode: 'sql' | 'text' /* this is an ai generation stuff */
}