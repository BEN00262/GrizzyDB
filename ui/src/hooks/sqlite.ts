// @ts-ignore
import sqlite3InitModule from "@antonz/sqlean";
import { useEffect, useState } from "react";


async function init() {
    const sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
    });
    const version = sqlite3.capi.sqlite3_libversion();
    console.log(`Loaded SQLite ${version}`);
    return sqlite3;
}

export const useSqllite3DB = () => {
    const [sqllite, setSqllite] = useState(null);

    useEffect(() => {
        init().then((sqlite3) => {
            const db = new sqlite3.oo1.DB();
            // db.exec(SCHEMA);

            setSqllite(db);
        
            // const sql = "select * from employees";
            // let rows = [];
            // db.exec({
            //     sql,
            //     rowMode: "object",
            //     resultRows: rows,
            // });
        
            // console.log(rows);
        });
    }, []);

    return { sqllite }
}
