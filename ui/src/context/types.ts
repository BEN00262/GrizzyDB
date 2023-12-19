export interface ICredential {
    credentialKey: string
    value: string
    isHidden: boolean
}

export type DBDialect = 'postgres' | 'mysql' | 'mariadb';

export type ProductType = 'hosted' | 'bring_your_own';

export interface IDatabaseDisplay {
    _id: string
    name: string
    product_type: ProductType;
    dialect: DBDialect
    credentials: ICredential[]
}

export interface ISnapshot {
    _id: string
    checksum: string
    createdAt: Date
    updatedAt: Date
    humanTime: string
    status: 'scheduled' | 'generating' | 'done' | 'failed'
}

export interface IFolder {
    _id: string;
    name: string;
}

export interface IGrizzyDBGlobalState {
    user_fingerprint: string | null
    auth_token: string | null
    active_database: number
    databases: IDatabaseDisplay[]
}

export type ActionType = string

export interface IAction {
    type: ActionType
    payload?: any
}

export interface IDatabase {
    dialect: DBDialect;
    product_type: ProductType;
    logo: string;
    enabled: boolean;
}

export interface ISampleTemplate {
    dialect: DBDialect;
    name: string
    sql_statements: string
}

export type Template = 'custom' | 'sample' | 'none' | 'bring_your_own' | 'external'

export interface IDatabaseTemplate {
    dialect: DBDialect;
    product_type: ProductType;
    selected_template: Template;
    sample_data_template: string;
    custom_schema_template: string;
}

export interface IDBQuery {
    query: string
    mode: 'sql' | 'text' /* this is an ai generation stuff */
}

export interface IQuickLinkCreate {
    quick_links: {
        database: string;
    }[];
}

export interface IQuickLinkData {
    position: number;
    _id: string;
    database: IDatabaseDisplay;
}

export interface IQuickLinkUpdate {
    position: number;
    _id: string;
    database: string;
}

export interface ISearchResult {
    databases: IDatabaseDisplay[];
    folders: IFolder[];
}

export interface IQueryAnalytic {
    query: string;
    calls: number;
    total_time: number;
    mean_time: number;
}