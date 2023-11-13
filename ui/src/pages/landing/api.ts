import axios from "axios";
import { IDatabaseDisplay, IFolder } from "../../context/types";

export function get_my_databases(folder_ref?:string) {
    return axios.get(`/database/list${folder_ref ? '/' + folder_ref : ''}`).then(({ data }) => ({
        databases: (data?.data?.databases ?? []) as IDatabaseDisplay[],
        folders: (data?.data?.folders ?? []) as IFolder[]
    }))
}

export function get_monitor_installation_instructions(database_reference: string) {
    return axios.get(`/database/installation/${database_reference}`).then(({ data }) => (data?.data?.instructions ?? '') as string)
}

export function delete_database(databse_reference: string) {
    return axios.delete(`/database/${databse_reference}`);
}
