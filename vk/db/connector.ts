import { Sequelize } from "sequelize";

import { mkdir } from "fs";


const sequelize: Sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data.db"
});


class AsyncDataBaseConnector {
    path: string;
    db_prefix: string;
    constructor(path_to_db: string = "./", db_prefix: string = "db") {
        this.path = path_to_db;
        this.db_prefix = db_prefix;
    }
}