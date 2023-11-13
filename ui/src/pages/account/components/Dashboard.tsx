import Databases from "./Databases";
import { useUser } from "@clerk/clerk-react";

export default function DatabaseDashboard() {
    const { user } = useUser();

    return (
        <div>
            <div className="hero-dashboard">
                <h1 className="action-text">Welcome back {user?.username ?? user?.firstName}</h1>
            </div>

            <Databases/>
        </div>
    )
}