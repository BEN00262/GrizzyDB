import { useGrizzyDBState } from "../context"

export const useActiveDatabase = () => {
    const { active_database, databases } = useGrizzyDBState();

    return { active_database: databases?.[active_database] };
}