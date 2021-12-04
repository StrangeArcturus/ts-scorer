//import { SELECT } from "sequelize/dist/lib/query-types";
import { Sequelize, QueryTypes } from "sequelize";

import { mkdir } from "fs";
import { threadId } from "worker_threads";


const sequelize: Sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data.db"
});


class AsyncDataBaseConnector {
    path: string;
    db_prefix: string;
    sequelize: Sequelize;
    private log_prefix: string = '[Sequeleize] [SQLite]';
    
    constructor(path_to_db: string = "./", db_prefix: string = "db", sequelize: Sequelize) {
        this.path = path_to_db;
        this.db_prefix = db_prefix;
        this.sequelize = sequelize;
        let _path: string = path_to_db.split("/").slice(0, -1).join("/");
        mkdir(_path, { recursive: true }, error => error ? console.error(error) : {});
        console.log(`${this.log_prefix} inited DBConnector with path ${path_to_db}`);
    }

    private async __check_subject(user_id: string | number, subject: string): Promise<number| boolean | void> {
        let subjects: Array<string | any> = [];
        try {
            subjects = await this.sequelize.query(`
                SELECT * FROM ${this.db_prefix}_${user_id}
                WHERE subjects = ?
                `, {
                    type: QueryTypes.SELECT,
                    replacements: [subject.toLowerCase()]
                })
        } catch {
            console.error(`${this.log_prefix} oops, error in database`);
            return;
        }
        if (!(subjects.length))
            return;
        else if (subjects.length === 1)
            return true;
        else if (subjects.length > 1)
            return 1;
    }

    async add_user(user_id: string | number): Promise<number | void> {
        try {
            await this.sequelize.query(`
                CREATE TABLE IF NOT EXSIST ${this.db_prefix}_${user_id}
                (subject TEXT, score TEXT)
                `);
        } catch {
            console.error(
                `${this.log_prefix} table ${this.db_prefix}_${user_id} was created in ${this.path} db`
            );
            return 1;
        }
        console.log(`${this.log_prefix }created table ${this.db_prefix}_${user_id} in ${this.path} db`);
    }

    async add_subject_to_user(
        user_id: string | number,
        subject: string,
        scores: string = ""
    ): Promise<number | void> {
        try {
            let subject_result = await this.__check_subject(user_id, subject);
            if (subject_result && typeof subject_result === 'boolean') {
                await this.sequelize.query(`
                    INSERT INTO ${this.db_prefix}_${user_id}
                    VALUES (?, ?)
                    `, {
                        type: QueryTypes.INSERT,
                        replacements: [subject.toLowerCase(), scores.toLowerCase()]
                    }
                );
            } else {
                return 1
            }
        } catch {
            console.error(
                `${this.log_prefix} oops, smth goes wrong with add subject ${subject} to user ${user_id}`
            );
            return 1;
        }
        console.log(`${this.log_prefix} added subject ${subject} to user ${user_id}`);
    }

    async add_scores_to_subject(
        user_id: string | number,
        subject: string,
        scores: string
    ): Promise<number | void> {
        let subjects: any;
        try {
            let subject_result = await this.__check_subject(user_id, subject);
            if (subject_result && typeof subject_result === 'boolean') {
                subjects = await this.sequelize.query(`
                    SELECT * FROM ${this.db_prefix}_${user_id}
                    WHERE subjects = ?
                `, {
                    type: QueryTypes.SELECT,
                    replacements: [subject.toLowerCase()]
                });
            } else {
                return 1;
            }
        } catch {
            console.error(
                `${this.log_prefix} oops, smth goes wrong with add scores to subject ${subject} to user ${user_id}`
            );
            return 1;
        }
        if (subjects) {
            subjects[1] += scores.toLowerCase();
        }
        try {
            this.sequelize.query(`
            UPDATE ${this.db_prefix}_${user_id}
            SET subject = ?,
                score = ?`, {
                    type: QueryTypes.UPDATE,
                    replacements: [subjects[0], subjects[1]]
            });
        } catch {
            console.error(
                `${this.log_prefix} oops, smth goes wrong with update user's ${user_id} subject ${subject}`
            );
            return 1;
        }
        console.log(`${this.log_prefix} user's ${user_id} data was updated`);
    }
}