import axios from "axios";
import { IDBQuery, IDatabase, IDatabaseDisplay, IDatabaseTemplate, ISampleTemplate, ISnapshot } from "../../../context/types";
import { DatabaseConfig } from "../../../components/Visualizer/types";

export function get_available_database() {
    return axios.get('/database/available').then(({ data }) => (data?.data?.databases ?? []) as IDatabase[])
}

export function get_available_sample_data_templates() {
    return axios.get('/samples').then(({ data }) => (data?.data?.samples ?? []) as ISampleTemplate[])
}

export function provision_database(template: IDatabaseTemplate, parent_folder?: string) {
    return axios.post(`/database${parent_folder ? '/' + parent_folder : ''}`, template).then(({ data }) => (data?.data?.database ?? []) as IDatabaseDisplay)
}

export function create_folder(folder: string, files: string[], parent_folder?: string) {
    return axios.post(`/database/folder${parent_folder ? '/' + parent_folder : ''}`, {
        name: folder,
        databases_to_add_to_folder: files
    })
}

export function query_database(database_reference: string, database: IDBQuery) {
    return axios.post(`/database/query/${database_reference}`, database).then(({ data }) => (data?.data?.response ?? []) as any[])   
}

export function get_database_snapshots(database_reference: string) {
    return axios.get(`/database/snapshots/${database_reference}`).then(({ data }) => (data?.data?.snapshots ?? []) as ISnapshot[])
}

export function get_database_diff(main: string, compare: string) {
    return axios.get(`/database/diffs${main ? '/' + main : ''}${compare ? '/' + compare : ''}`).then(({ data }) => (data?.data?.diff_tree ?? []) as DatabaseConfig)
}