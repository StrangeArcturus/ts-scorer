import { Database, RunResult, sqlite3, verbose } from 'sqlite3';
import { mkdir } from 'fs';

/**
 * interface for `row` in sql-query `SELECT`
 */
interface IQueryAnswer {
    subject: string;
    score: string;
}


/**
 * type for id of user
 * `string` or `number`
 */
type userType = string | number;

/**
 * class for connect to `SQLite` database
 */
export class AsyncDataBaseConnector {
    /**
     * path to SQLite database
     */
    private readonly path: string;
    /**
     * prefix in SQL-tables' names
     */
    private readonly db_prefix: string;
    /**
     * prefix for more info in logs
     */
    private readonly log_prefix: string;
    /**
     * i don't now why it is needed,
     * but it needed in `sqlite3` docs
     */
    private sqlite3: sqlite3;
    /**
     * low-level SQLite connect
     */
    private db: Database;

    constructor(path_to_db: string, db_prefix: string = 'db') {
        this.path = path_to_db;
        this.db_prefix = db_prefix;
        this.log_prefix = "[SQLite]";
        this.sqlite3 = verbose();
        this.db = new Database(path_to_db, error => error ? console.error(error) : {});
        let _path: string = path_to_db.split("/").slice(0, -1).join("/");
        mkdir(_path, { recursive: true }, error => error ? console.error(error) : console.log(`path to db maked successfully`));
        console.log(`${this.log_prefix} inited Connector with path ${path_to_db}`);
    }

    /**
     * method for checking subjects on originality
     * @returns `1` if subjects with name `subject` > `1`
     * @returns `true` if subjects with name `subject` === `1`
     * @returns `undefined` if not found subjects with name `subject`
     * @returns Promise
     */
    private async __check_subject(user_id: userType, subject: string): Promise<number | boolean | void> {
        let subjects: Array<string> = [];
        this.db.serialize((): void => {
            this.db.each(`
            SELECT * FROM ${this.db_prefix}_${user_id}
            WHERE subject = '${subject.toLowerCase()}'
            `, (error: any, row: IQueryAnswer): void => {
                error ?
                console.error(error) :
                subjects.push(row.subject);
            });
        });
        if (!(subjects.length))
            return;
        else if (subjects.length === 1)
            return true;
        else if (subjects.length > 1)
            return 1;
    }

    /**
     * add user to database on path in this
     * (`CREATE TABLE` query)
     * @param user_id userType
     * @returns Promise of void
     */
    async add_user(user_id: userType): Promise<void> {
        this.db.serialize((): void => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS ${this.db_prefix}_${user_id}
                (subject TEXT, score TEXT)
            `, (result: any, error: any) => {
                error ?
                console.error(error) : 
                console.log(
                    `${this.log_prefix} created table ${this.db_prefix}_${user_id} in ${this.path} db ${result ? '\nwith result: ' + result : ''}`
                );
            });
        });
    }

    /**
     * add subject to user-table
     * (`INSERT INTO ... VALUES` query)
     * @param user_id `userType` (see above)
     * @param subject `string`
     * @param scores `string`
     * @returns `Promise` of `1` or `void`
     */
    async add_subject_to_user(user_id: userType, subject: string, scores: string = ""): Promise<number | void> {
        let subject_result = await this.__check_subject(user_id, subject);
        if (typeof subject_result === 'boolean') {
            this.db.serialize((): void => {
                this.db.run(`
                    INSERT INTO ${this.db_prefix}_${user_id}
                    VALUES ('${subject.toLowerCase()}', '${scores.toLowerCase()}')
                `, (result: RunResult, error: any) => {
                    error ?
                    console.error(error) :
                    console.log(
                        `${this.log_prefix} added subject ${subject} to user ${user_id} ${result ? '\nwith result: ' + result : ''}`
                    );
                });
            });
        } else return 1;
    }

    /**
     * add scores to subject in user-table
     * (`SELECT ... FROM ... WHERE subjects = ...`
     * and then
     * `UPDATE ... SET score = ... WHERE subject = ...` queryes)
     * @param user_id `userType` (see above)
     * @param subject `string`
     * @param scores `string`
     * @returns `Promise` of `1` or `void`
     */
    async add_scores_to_subject(user_id: userType, subject: string, scores: string = ""): Promise<number | void> {
        let subject_result = await this.__check_subject(user_id, subject);
        let subjects: Array<IQueryAnswer> = [];
        if (typeof subject_result === 'boolean') {
            this.db.serialize((): void => {
                this.db.each(`
                    SELECT * FROM ${this.db_prefix}_${user_id}
                    WHERE subjects = '${subject.toLowerCase()}'
                `, (error: any, row: IQueryAnswer): void => {
                    error ? console.error(error) : subjects.push(row);
                });
            });
        } else return 1;
        if (subjects.length) {
            subjects[0].score += scores.toLowerCase();
        }
        this.db.serialize((): void => {
            this.db.run(`
                UPDATE ${this.db_prefix}_${user_id}
                SET score = '${subjects[0].score}'
                WHERE subject = '${subject.toLowerCase()}'
            `, (result: RunResult, error: Error): void => {
                error ?
                console.error(error) :
                console.log(
                    `${this.log_prefix} user's ${user_id} data was updated ${result ? '\nwith result: ' + result : ''}`
                );
            });
        });
    }

    /**
     * clean scores of subject `subject` in user-table
     * (`UPDATE ... SET score = '' WHERE subject = ...` query)
     * @param user_id `userType` (see above)
     * @param subject `string`
     * @returns `Promise` of `void`
     */
    async clean_subject(user_id: userType, subject: string): Promise<void> {
        this.db.serialize((): void => {
            this.db.run(`
            UPDATE ${this.db_prefix}_${user_id}
            SET score = ''
            WHERE subject = '${subject.toLowerCase()}'
            `, (result: RunResult, error: Error): void => {
                error ?
                console.error(error) :
                console.log(
                    `${this.log_prefix} user's ${user_id} data was updated ${result ? '\nwith result: ' + result : ''}`
                );
            });
        });
    }

    /**
     * delete all notes in user-table
     * (`DELETE FROM ...` query)
     * @param user_id `userType` (see above)
     * @returns `Promise` of `void`
     */
    async clean_all_users_subjects(user_id: userType): Promise<void> {
        this.db.serialize((): void => {
            this.db.run(`
                DELETE FROM ${this.db_prefix}_${user_id}
            `, (result: RunResult, error: Error): void => {
                error ?
                console.error(error) :
                console.log(
                    `${this.log_prefix} all user's ${user_id} subjects was deleted successfully ${result ? '\nwith result: ' + result : ''}`
                );
            });
        });
    }

    /**
     * calculate middle score of user `scores`
     * @param scores `string` of scores === `numbers` and `letters`
     * @returns `Promise` of `number`
     */
    private async __calculate_scores(scores: string): Promise<number> {
        let filtered_scores: Array<string> = scores.split(" ").filter(elem => !isNaN(+elem));
        let result: number = ((arr: Array<string>): number => {
            let sum: number = 0;
            arr.forEach(
                (elem: string): void => {sum += +elem;}
            )
            return sum;
        })(filtered_scores) / filtered_scores.length;
        return result;
    }

    /**
     * calculate middle user's `score`
     * (`SELECT ... FROM ... WHERE subject = ...` query)
     * @param user_id `userType` (see above)
     * @param subject `string`
     * @returns `Promise` of `number` or `void`
     */
    async now_score(user_id: userType, subject: string): Promise<number | void> {
        let subjects: Array<IQueryAnswer> = [];
        this.db.serialize((): void => {
            this.db.each(`
                SELECT * FROM ${this.db_prefix}_${user_id}
                WHERE subject = ${subject.toLowerCase()}
            `, (error: Error, row: IQueryAnswer): void => {
                error ?
                console.error(error) :
                subjects.push(row);
            });
        });
        if (subjects.length) {
            let result: number = await this.__calculate_scores(subjects[0].score);
            console.log(`${this.log_prefix} user's ${user_id} middle score of subject ${subject} was calculated successfully: ${result}`);
            return result;
        }
    }

    /**
     * predict user's `scores` with `predict_scores`
     * (`SELECT ... FROM ... WHERE subject = ...` query)
     * @param user_id `userType` (see above)
     * @param subject `string`
     * @param predict_scores `string`
     * @returns `Promise` of `number` or `void`
     */
    async predict_scores(user_id: userType, subject: string, predict_scores: string): Promise<number | void> {
        let subjects: Array<IQueryAnswer> = [];
        this.db.serialize((): void => {
            this.db.each(`
                SELECT * FROM ${this.db_prefix}_${user_id}
                WHERE subject = ${subject.toLowerCase()}
            `, (error: Error, row: IQueryAnswer): void => {
                error ?
                console.error(error) :
                subjects.push(row);
            });
        });
        if (subjects.length) {
            let result: number = await this.__calculate_scores(subjects[0].score + predict_scores);
            console.log(`${this.log_prefix} user's ${user_id} middle score of subject ${subject} was calculated successfully: ${result}`);
            return result;
        }
    }

    /**
     * get all user's `subjects` and `scores`
     * @param user_id `userType` (see above)
     * @returns `Promise`
     */
    async all_subjects_with_scores_as_string_table(user_id: userType): Promise<string> {
        let subjects: Array<IQueryAnswer> = [];
        this.db.serialize((): void => {
            this.db.each(`
            SELECT * FROM ${this.db_prefix}_${user_id}
            `, (error: Error, row: IQueryAnswer): void => {
                error ?
                console.error(error) :
                subjects.push(row);
            });
        });
        let answer: string = '';
        subjects.forEach((element: IQueryAnswer): void => {
            answer += `${element.subject}: ${element.score}\n`;
        });
        return answer;
    }
}
