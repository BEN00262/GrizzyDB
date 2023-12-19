import axios from "axios";
import { IDatabaseDisplay, IFolder, IQueryAnalytic, IQuickLinkCreate, IQuickLinkData, ISearchResult } from "../../context/types";

export function get_my_databases(folder_ref?:string) {
    return axios.get(`/database/list${folder_ref ? '/' + folder_ref : ''}`).then(({ data }) => ({
        databases: (data?.data?.databases ?? []) as IDatabaseDisplay[],
        folders: (data?.data?.folders ?? []) as IFolder[]
    }))
}

export function get_monitor_installation_instructions(database_reference: string) {
    return axios.get(`/database/installation/${database_reference}`).then(({ data }) => (data?.data?.instructions ?? '') as string)
}

export function get_my_quick_links() {
    return axios.get(`/database/quick-links`).then(({ data }) => (data?.data?.quick_accesses ?? []) as IQuickLinkData[])
}

export function get_snapshot_download_link(snapshot: string) {
    return axios.get(`/database/export-snapshot/${snapshot}`).then(({ data }) => (data?.data?.download_link) as string)
}

export function get_query_analysis(database_reference: string) {
    return axios.get(`/database/query-analytics/${database_reference}`).then(({ data }) => (data?.data?.queries ?? []) as IQueryAnalytic[])
}

export function delete_snapshot(snapshot: string) {
    return axios.delete(`/database/snapshot/${snapshot}`);
}

export function switch_to_snapshot(snapshot: string) {
    return axios.post(`/database/switch-to-snapshot/${snapshot}`);
}

export function search_for_database_or_folder(query: string) {
    return axios.get(`/database/search?query=${query}`).then(({ data }) => (data?.data ?? {}) as ISearchResult);
}

export function create_quick_links(data: IQuickLinkCreate) {
    return axios.post(`/database/quick-links`, data);
}

export function get_checkout_link() {
    return axios.get(`/database/checkout`).then(({ data }) => data?.data?.checkout_link as string);
}

export function check_if_subscribed() {
    return axios.get(`/database/check-if-subscribed`).then(({ data }) => data?.data?.is_subscribed as boolean);
}

export function delete_quick_links(quick_link_reference: string) {
    return axios.delete(`/database/quick-links${quick_link_reference}`);
}

export function delete_database(databse_reference: string) {
    return axios.delete(`/database/${databse_reference}`);
}

export function get_exposed_databases(data: any) {
    return axios.post(`/database/available`, data).then(({ data }) => (data?.data?.databases ?? []) as string[]);
}

export function connect_external_database(data: any, parent_folder?: string) {
    return axios.post(`/database/connect-to-external-database${parent_folder ? "/" + parent_folder : ""}`, data);
}

export function move_to_folder(folder: string, database_reference: string) {
    return axios.post(`/database/folder/move-to`, { folder, database_reference });
}