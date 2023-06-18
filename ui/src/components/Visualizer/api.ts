import axios from "axios";
import { DatabaseConfig } from "./types";

export function get_database_schema(database_reference: string) {
    return axios.get(`/database/schema/${database_reference}`)
        .then(({ data }) => data?.data?.schema as DatabaseConfig)
}