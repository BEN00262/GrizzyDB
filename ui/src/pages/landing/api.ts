import axios from "axios";
import { IDatabaseDisplay } from "../../context/types";

export function get_my_databases() {
    return axios.get('/database').then(({ data }) => (data?.data?.databases ?? []) as IDatabaseDisplay[])
}

export function delete_database(databse_reference: string) {
    return axios.delete(`/database/${databse_reference}`);
}
