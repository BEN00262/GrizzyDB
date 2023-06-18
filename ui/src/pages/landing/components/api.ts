import axios from "axios";
import { IDBQuery, IDatabase, IDatabaseDisplay, IDatabaseTemplate, ISampleTemplate } from "../../../context/types";

export function get_available_database() {
    return axios.get('/database/available').then(({ data }) => (data?.data?.databases ?? []) as IDatabase[])
}

export function get_available_sample_data_templates() {
    return axios.get('/samples').then(({ data }) => (data?.data?.samples ?? []) as ISampleTemplate[])
}

export function provision_database(template: IDatabaseTemplate) {
    return axios.post('/database', template).then(({ data }) => (data?.data?.database ?? []) as IDatabaseDisplay)
}

export function query_database(database_reference: string, database: IDBQuery) {
    return axios.post(`/database/query/${database_reference}`, database).then(({ data }) => (data?.data?.response ?? []) as any[])   
}