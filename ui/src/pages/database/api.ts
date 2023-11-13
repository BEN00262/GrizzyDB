import axios from "axios";
import { IDatabaseDisplay } from "../../context/types";

export function get_database(reference: string) {
    return axios.get(`/database/${reference}`).then(({ data }) => (data?.data?.database ?? {}) as IDatabaseDisplay)
}

export function delete_database(databse_reference: string) {
    return axios.delete(`/database/${databse_reference}`);
}

export function update_database_metadata(databse_reference: string, data: {
    name: string
}) {
    return axios.put(`/database/${databse_reference}`, data);
}