var spreadsheet = SpreadsheetApp.getActive(); //シートを取得
var sheet_log = spreadsheet.getSheetByName("log"); // GAS上のデータのやり取りを記録するスプレッドシートのシート
var sheet_task = spreadsheet.getSheetByName("task"); // googleカレンダーからタスク名を取得・記録するスプレッドシートのシート
var last_row_task = sheet_task.getLastRow(); // 空白でない最終行の位置を取得
var d = new Date();
var y = d.getFullYear();
var mon = d.getMonth() + 1;
var d2 = d.getDate();
var today = y + "/" + mon + "/" + d2 + " 00:00:00"; // 今日の0時0分0秒の値を格納


/** index.htmlを開く */
function doGet() {
    var template = "index";

    return HtmlService.createTemplateFromFile(template)
        .evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}


/** include(html名)でhtmlファイルを読み込む */
function include(filename) {

    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/** スプレッドシートから現在時刻に取り組む予定のタスク名を取得する */
function findTaskNow() {
    // nowの時間に取り組む予定のタイトルを格納。予定がない場合初期値を返す。
    var task_title = "予定タイトルが見つかりませんでした。";
    var row_task = last_row_task; // taskシートの空白でない最終行を代入
    var now = new Date(); //現在時刻取得

    for (row_task; row_task > 2; row_task--) {
        // シートtaskの空白でない最終行から1行ずつさかのぼり、現在時刻に設定されている予定タイトルを探索する

        // シートから取得した日付がDateオフジェクトになっているので、現在の時刻(Dateオブジェクト)と比較する
        if (sheet_task.getRange(row_task, 3).getValue() <= now && now < sheet_task.getRange(row_task, 4).getValue()) {
            task_title = sheet_task.getRange(row_task, 2).getValue();

            break;
        }
        if (today > sheet_task.getRange(row_task, 3).getValue()) {
            // 検索範囲が昨日に到達、またはスプレッドシートの上から３行目まで到達した場合処理を終了する

            break;
        }
    }

    return task_title;
}

/** jsから受け取った値に一致する文言をスプレッドシートのシートdictから探索し、一致した文言に対応した文言をjs返す */
function findTalkDict(talk_data) {
    recognizeLogWrite(talk_data.talk_no, talk_data.request_text);
    var sheet_dict = spreadsheet.getSheetByName("dict");
    var dict_range = sheet_dict.getDataRange().getValues(); // 空白でない値を取得

    if (talk_data.talk_no_flag == true) {
        // @noXを探索する
        talk_data.request_text = talk_data.init_request_text;
        talk_data.response_text = talk_data.init_request_text;
        talk_data.i = 0;
        talk_data.j = 0;
        for (talk_data.i; talk_data.i < dict_range.length; talk_data.i++) {
            if (dict_range[talk_data.i][talk_data.j].trim() == talk_data.talk_no.trim()) {
                // 一致する@noXを見つけた場合
                talk_data.j++; // 1つ右のセルに移動
                talk_data.talk_no_flag = false;
                // @noXの値が見つかったらループを抜ける

                break;
            }
        }
    }

    talk_loop:
    for (var loop_break_count = 1; loop_break_count < 2; loop_break_count++) {
        // ループが必要以上に回ることを防ぐ
        // ラベルを付けてbreakしたいためにforループを使用している。ループの必要はない

        // 必ず会話はbot側の発言で終わるdictとしいておく
        for (talk_data.i; talk_data.i < dict_range.length; talk_data.i++) {

            if (-1 < dict_range[talk_data.i][talk_data.j].indexOf("@-")) {
                speakLogWrite(talk_data.talk_no, talk_data.response_text);

                break talk_loop; // talk_loopラベルの付いたforループを抜ける
            }

            if (-1 < dict_range[talk_data.i][talk_data.j].indexOf(talk_data.request_text) ||
                -1 < dict_range[talk_data.i][talk_data.j].indexOf("@other")) {
                talk_data.j++;

                if (-1 < dict_range[talk_data.i][talk_data.j].indexOf("@exit")) {
                    talk_data.response_text = dict_range[talk_data.i][talk_data.j].replace("@exit", "");
                    if (talk_data.response_text == "") {

                        break talk_loop; // talk_loopラベルの付いたforループを抜ける
                    }
                    // 音声認識せずに終了させるためフラグを立てる
                    talk_data.recog_flag = false;
                    talk_data.response_text = replaceRecognizeText(talk_data.response_text, talk_data.request_text);
                    speakLogWrite(talk_data.talk_no, talk_data.response_text);

                    return talk_data;
                }

                if (-1 < dict_range[talk_data.i][talk_data.j].indexOf("@no")) {
                    // @noを変更・ループさせるためフラグを立てる
                    talk_data.talk_no_flag = true;
                    talk_data.recog_flag = true;
                    // @no以降の文字列を切り取る
                    talk_data.talk_no = dict_range[talk_data.i][talk_data.j];
                    talk_data.talk_no = talk_data.talk_no.slice(dict_range[talk_data.i][talk_data.j].indexOf("@no"));

                    if (dict_range[talk_data.i][talk_data.j].indexOf("@no") == 0) {
                        // @noの文言のみが書かれていた場合
                        talk_data.response_text = "";
                        speakLogWrite(talk_data.talk_no, talk_data.response_text);

                        return talk_data;
                    }

                    // @no以前の文字列を切り取る
                    talk_data.response_text = dict_range[talk_data.i][talk_data.j];
                    talk_data.response_text = talk_data.response_text.slice(0, talk_data.response_text.indexOf("@no") - 1);
                    talk_data.response_text = replaceRecognizeText(talk_data.response_text, talk_data.request_text);
                    speakLogWrite(talk_data.talk_no, talk_data.response_text);

                    return talk_data;
                }

                talk_data.response_text = dict_range[talk_data.i][talk_data.j];
                talk_data.response_text = replaceRecognizeText(talk_data.response_text, talk_data.request_text);
                speakLogWrite(talk_data.talk_no, talk_data.response_text);
                talk_data.recog_flag = true;
                talk_data.j++;

                return talk_data;
            }
        }
    }
    talk_data.talk_no_flag = false;
    talk_data.response_text = "辞書に一致する項目がありませんでした。"
    talk_data.recog_flag = false;

    return talk_data;
}

/** セルの値に@{}が含まれる場合、1つ左のセルの値と置き換える */
function replaceRecognizeText(response_text, request_text) {
    if (-1 < response_text.indexOf("@{}")) {
        // @{}を聞き取った文字に置き換え
        response_text = response_text.replace("@{}", request_text);
    }

    return response_text;
}


/** 音声合成した文言をスプレッドシートのlogシートに記録 */
function speakLogWrite(talk_no, response_text) {
    var d = new Date();
    var y = d.getFullYear();
    var mon = d.getMonth() + 1;
    var d2 = d.getDate();
    var h = d.getHours();
    var min = d.getMinutes();
    var s = d.getSeconds();
    var now = y+"/"+mon+"/"+d2+" "+h+":"+min+":"+s;

    // 以下をシートの最終行に追記
    sheet_log.appendRow(
        [
            now, // 現在時刻
            talk_no, // @noX
            "response",
            response_text, // 音声合成した文言
        ]
    );
}

/** 音声認識した文言をスプレッドシートのlogシートに記録 */
function recognizeLogWrite(talk_no, request_text) {
    var d = new Date();
    var y = d.getFullYear();
    var mon = d.getMonth() + 1;
    var d2 = d.getDate();
    var h = d.getHours();
    var min = d.getMinutes();
    var s = d.getSeconds();
    var now = y+"/"+mon+"/"+d2+" "+h+":"+min+":"+s;

    // 以下をシートの最終行に追記
    sheet_log.appendRow(
        [
            now, // 現在時刻
            talk_no, // @noX
            "request",
            request_text, // 音声認識した文言
        ]
    );
}

/**
 googleカレンダーに登録されている予定のタイトルと開始・数量時間をスプレッドシートのtaskシートに記録
 時間主導型のトリガーに設定する関数
*/
function getCalenderTask() {
    var ofCal = CalendarApp.getCalendarById("カレンダーのIDを入力 例：~.getCalendarById('test@gmail.com');"); //特定のIDのカレンダーを取得
    var today_task_no = 1; //No
    var startDate = new Date(today); //取得開始日
    var endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);　//取得終了日
    var Events = ofCal.getEvents(startDate, endDate); //カレンダーの予定を取得

    /** 予定の数だけ繰り返してシートの最終行に記録 */
    for each(var evt in Events) {
        sheet_task.appendRow(
            [
                today_task_no, //No
                evt.getTitle(), //イベントタイトル
                evt.getStartTime(), //予定の開始時刻
                evt.getEndTime(), //予定の終了時刻
                "=(INDIRECT(\"RC[-1]\",FALSE)-INDIRECT(\"RC[-2]\",FALSE))*24" //所要時間を計算
            ]
        );
        today_task_no++;
    }
}