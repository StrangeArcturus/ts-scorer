import { connector } from './bot';


const indent: string = '    ';
const hello: string = `
Итак, все команды для справки по боту:\n
/start -- для начала общения (:
/help -- для вызова помощи по командам
в любой момент можно будет посмотреть инструкцию и помошь тут, в разделе /help\n\n
Итак, команды управления данными:
!добавить -- добавляет в базу данных ваш предмет. 
Внимание, знак восклицательного знака (!) в этой и в следующих командах обязателен!
${indent}Для работы с командами с аргументами,
их нужно писать в формате "добавить <название предмета>", через пробел и жеталельно без лишних слов!
${indent}Эту, как и другие команды со знаком "!", писать желательно маленькими буквами
Внимание!!! В силу технических возможностей, названия предметов должны быть без пробелов!!!
!дописать -- дописывает оценку к уже существующему предмету, пример использования -- "!дописать матеша 4"
!очистить -- безвозвратно стирает оценки по выбранному предмету, но не удаляет его. Пример -- "!очистить инфа"
!стереть_всё -- безвозвратно стирает все ваши предметы.
Полезно перед 1 сентября, или когда начат новый семестр/триместр/четверть
!текущий_балл -- подсчитывает нынешний балл по выбранному предмету. Пример -- "!текущий_балл геометрия"
!предсказать_балл -- какой будет средний балл по выбранному предмету с учётом указанной оценки. 
Пример -- "!предсказать_балл русский 4"
!все_предметы -- выводит в сообщении все ваши предметы и оценки по ним. Пример -- "!все_предметы"\n
Если что-то не так или есть вопросы -- пишите @strange_arcturus
Заранее спасибо.`;



export async function handle_message(text: string, user_id: string | number): Promise<string> {
    let answer: string = "";
    let args: Array<string> = text.toLowerCase().split("\n");
    let command: any = args.shift();
    let subject: any = args.shift();
    let scores: string = args.join(" ");
    let result: any;
    switch (command) {
        case "start":
        case "/start":
        case "/старт":
        case "старт":
            answer = "Привет, я -- бот-дневник)\nПомощь: команды /help /помощь /хелп";
            break;
        case "help":
        case "/help":
        case "помощь":
        case "/помощь":
        case "хелп":
        case "/хелп":
            answer = hello;
            break;
        case "добавить":
            result = await connector.add_subject_to_user(user_id, subject, scores ? scores : '');
            answer = result ?
                "Упс, что-то пошло не так с добавлением предмета..." :
                `Предмет ${subject} успешно добавлен в базу данных ${scores ? 'с оценками ' + scores : ''}`;
            break;
        case "дописать":
            result = await connector.add_scores_to_subject(user_id, subject, scores ? scores : '');
            answer = result ?
                "Упс, что-то пошло не так с добавлением оценок..." :
                `Предмет ${subject} успешно добавлен в базу данных ${scores ? 'с оценками ' + scores : ''}`;
            break;
        case "очистить":
            await connector.clean_subject(user_id, subject);
            answer = `Оценки по предмету ${subject} были успешно и безвозвратно стёрты ^-^`;
            break;
        case "стереть_всё":
            await connector.clean_all_users_subjects(user_id);
            answer = `Все ваши предметы и оценки по ним успешно удалены ^-^`;
            break;
        case "текущий_балл":
            result = await connector.now_score(user_id, subject);
            answer = typeof result === "number" ?
                `Средний балл по вашему предмету ${subject} составляет ${result} баллов` :
                `Упс, возникла ошибка, возможно, Вы ещё не добавили предметов в базу данных :(`;
            break;
        case "предсказать_балл":
            result = await connector.predict_scores(user_id, subject, scores);
            answer = result ?
                `Предсказанный балл по предмету ${subject} с учётом оценок ${scores} составляет ${result}` :
                `Упс, возникла ошибка, возможно, Вы ещё не добавили предметов в базу данных :(`;
            break;
        case "все_предметы":
            answer = `Ваши оценки по всем добавленным предметам\n\n`
            answer += await connector.all_subjects_with_scores_as_string_table(user_id);
            break;
        default:
            answer = `Простите, но мне понятны только предписанные команды, а человеческую речь мне не понять :(`;
            answer += `\nДля помощи -- команды /help help помощь /помощь хелп /хелп`;
            break;
    }
    return answer;
}
