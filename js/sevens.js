/* last updated:<2016/12/04/Sun 15:39:06 from:halley-fmvs76g> */

function sevens() {
    var PREPARE, DISTRIBUTE, LOCATE = [], MAIN;
    var status = 0;             // 0:タイトル  1:ゲーム画面
    var statusList = [$("#titleScreen"), $("#field")];
    var numOfJoker = 1;
    var card = [];
    var field = $("#field");
    var cardSpace = $("#cardSpace");
    var fieldW = 950;
    var fieldH = 950;
    var cardW = 42;
    var cardH = 70;
    var selectedJoker = false;  // ジョーカーが選ばれたら true
    var selectedJokerNum = 0;   // 選ばれたジョーカーの通し番号を格納
    var ranking = [-1, -1, -1, -1]; // プレイヤーの順位を格納
    var mark = ["壱", "弐", "参", "肆", "伍", "陸", "漆", "捌", "玖", "拾",
                "拾壱", "拾弐", "拾参"];
    var group = ["red", "green", "blue", "yellow"];
    var player = [];
    // var place = [0, 50, -50, 100, -100, 150, -150, 200, -200, 250, -250, 300, -300, 350, -350];
    var place = [350, 300, 250, 200, 150, 100, 50, 0, -50, -100, -150, -200, -250, -300, -350];
    var turn = -1000;

    // main ################################
    init();
    changeScreen(status);

    // 自分の数字のカードをクリックしたら
    for(var i = 0; i < 52; i++) {
        (function (n) {
            $("#"+card[i].id).click(function() {
                if(turn == 0 && card[n].owner == 0) {
                    if(card[n].available == true
                       && checkFieldVacancy(n) == 0
                       && selectedJoker == false) {
                        clearInterval(MAIN);
                        emit(card, n);
                        if(returnNumOfCard(0) == 0) { // 手札がなくなったら
                            gameClear(0);
                        }
                        nextTurn();
                        MAIN = setInterval(main, 1500);
                        // ジョーカーを選択したあとにカードをクリックしたら
                    } else if(selectedJoker == true) {
                        joker(card, selectedJokerNum, n);
                    }
                }
            });
        })(i);
    }

    // 自分のジョーカーをクリックしたら
    for(var i = 52; i < 52+numOfJoker; i++) {
        (function (n) {
            $("#"+card[i].id).click(function() {
                if(card[n].owner == 0) { // selectedJoker の切り替え
                    if(selectedJoker == false) {
                        selectedJoker = true
                        selectedJokerNum = n;
                        setMark(1);
                    }
                    else {
                        selectedJoker = false;
                        setMark(0);
                    }
                }
            });
        })(i);
    }

    $("#pass").click(function() {
        if(turn == 0) {
            pass(turn);
            update();
        }
    });

    // タイトルに戻る
    $(".title").click(function() {
        location.reload();
    });

    // ゲームスタート
    $("#start").click(function() {
        status = 1;
        changeScreen(status);
        DISTRIBUTE = setInterval(distribute, 2000);
    });
    // function ################################
    function changeScreen(num) {
        for(var i = 0; i < 2; i++) {
            statusList[i].css({"display": "none"});
            if(i == num) statusList[i].css({"display": "inline-block"});
        }
    }

    function init() {
        for(var i = 0; i < 4; i++) {
            player.push(new Player(i));
        }
        update();
        for(var i = 0; i < 52; i++) { // カードの設定(ジョーカー以外)
            card.push(new Card(i%13, group[parseInt(i/13)], parseInt(i/13)));
            var id = ' id="' + card[i].id + '" ';
            cardSpace.append('<div '+id+'>'+mark[card[i].num]+'</div>');
            $("#"+card[i].id).addClass("card " + card[i].group);
            if(9 < i%13) {
                $("#"+card[i].id).addClass("twoCharacter");
            } else {
                $("#"+card[i].id).addClass("oneCharacter");
            }
        }
        for(var i = 0; i < numOfJoker; i++) { // ジョーカーの設定
            var id = 'joker' + String(i);
            card.push(new Card(i, "joker", 4));
            cardSpace.append('<div id="' + id + '">道化</div>');
            $("#"+id).addClass("card joker twoCharacter");
        }
        for(var i = 0; i < card.length; i++) { // カードの初期位置の設定
            $("#"+card[i].id).css({"top":String((fieldH-cardH)/2)+"px",
                                   "left":String((fieldW-cardW)/2)+"px"});
            $("#"+card[i].id).addClass("back");
        }
    }

    function main() {
        if(player[turn].clear == true || player[turn].gameover == true) {
            nextTurn();
            update();
        } else if(turn == 0) {  // 自分のターン
        } else {                // コンピュータのターン
            var num = selectCard(turn);
            if(num == -1) {     // パスなら
                pass(turn);
            } else {
                emit(card, num);
                if(returnNumOfCard(turn) == 0) { // 手札が0枚なら
                    gameClear(turn);
                }
                delete_at(player[turn].card, num);
                nextTurn();
            }
        }
        if(selectedJoker == false) {
            setMark(0);
        } else {
            setMark(1);
        }
    }

    // 更新
    function update() {
        var pInf = [];
        for(var i = 0; i < 4; i++) {
            if(player[i].gameover == true || player[i].clear == true) {
                if(i == 0) {
                    pInf[i] = "You! rank:"+String(returnRanking(i)+1);
                } else {
                    pInf[i] = "CPU"+String(i)+" rank:"+String(returnRanking(i)+1);
                }
            } else if(i == 0) {
                pInf[i] = "You! pass:"+String(player[i].pass);
            } else {
                pInf[i] = "CPU"+String(i)+" pass:"+String(player[i].pass);
            }
            // 現在のターンの人の文字を赤くする
            if(turn == i && player[turn].gameover == false
               && player[turn].clear == false) {
                pInf[i] = '<span style="color: red; text-shadow: none; '
                    +'font-weight: bold;">'+pInf[i]+'</span>';
            }
            if(i != 3) pInf[i] += "<br>";
        }
        for(var i = 0; i < 4; i++) {
            if(i == 0) {
                $("#playerInf").html(pInf[i]);
            } else {
                $("#playerInf").append(pInf[i]);
            }
        }
    }

    // プレイヤー番号を渡してランキングを返す
    function returnRanking(playerNum) {
        for(var i = 0; i < ranking.length; i++) {
            if(playerNum == ranking[i]) {
                return i;
            }
        }
    }

    // カードを配る
    function distribute() {
        var p0 = 0, p1 = 0, p2 = place.length-1, p3 = place.length-1;
        for(var i = 0; i < card.length; i++) {
            card[i].owner = i%4;
            player[i%4].card.push(i);
            switch(i%4) {
            case 0:
                card[i].place = place[p0];
                p0 += 1;
                break;
            case 1:
                card[i].place = place[p1];
                p1 += 1;
                break;
            case 2:
                card[i].place = place[p2];
                p2 -= 1;
                break;
            case 3:
                card[i].place = place[p3];
                p3 -= 1;
                break;
            }
            LOCATE.push(setInterval(locate, 50*i, i));
        }
        clearInterval(DISTRIBUTE);
    }

    // カードを配置
    function locate(i) {
        if(card[i].owner == 0) {
            $("#"+card[i].id).css({
                "top":String(fieldH-cardH-10)+"px",
                "left":String((fieldW-cardW)/2+card[i].place)+"px",
                "transform": "rotate(-1080deg)"
            }).on("transitionend", function() { // カードを表にする
                $("#"+card[i].id).removeClass("back");
            });
        } else if(card[i].owner == 1) {
            $("#"+card[i].id).css({
                "top":String((fieldH-cardH)/2+card[i].place)+"px",
                "left": "24px",
                "transform": "rotate(-990deg)"
            });
        } else if(card[i].owner == 2) {
            $("#"+card[i].id).css({
                "top":"10px",
                "left":String((fieldW-cardW)/2+card[i].place)+"px",
                "transform": "rotate(-900deg)"
            });
        } else if(card[i].owner == 3) {
            $("#"+card[i].id).css({
                "top":String((fieldH-cardH)/2+card[i].place)+"px",
                "left":String(fieldW-cardW-24)+"px",
                "transform": "rotate(-810deg)"
            });
        }
        if(i == 52+numOfJoker-1) {
            PREPARE = setInterval(prepare, 2000);
        }
        clearInterval(LOCATE[i]);
    }

    // 手札にある7を場に出し、赤の7を出した人のターンにする
    function prepare() {
        for(var i = 0; i < card.length; i++) {
            if(card[i].num == 6) {
                emit(card, i);
                delete_at(player[card[i].owner].card, i);
                if(card[i].group == "red") {
                    turn = card[i].owner;
                }
            }
            if(card[i].num == 5 || card[i].num == 7) {
                card[i].available = true;
            }
        }
        setMark(0);
        update();
        clearInterval(PREPARE);
        MAIN = setInterval(main, 1500);
    }

    // プレイヤーナンバーを渡してそのプレイヤーの持っているカードの枚数を返す
    function returnNumOfCard(playerNum) {
        var count = 0;
        for(var i = 0; i < card.length; i++) {
            if(card[i].owner == playerNum && card[i].status == false) {
                count += 1;
            }
        }
        return count;
    }

    // カードを場に出す
    function emit(card, i) {
        var top = (fieldH-cardH)/2-cardH*2;
        var left = (fieldW-cardW)/2 + (cardW+5)*(card[i].num-6);
        var size = (card[i].num<6)? 0: 1;
        top += (cardH + 10)*card[i].groupN;
        if(card[i].group != "joker") { // ジョーカーでないなら
            if(6 < card[i].num && card[i].num < 12) {
                card[i+1].available = true;
            } else if(0 < card[i].num && card[i].num < 6) {
                card[i-1].available = true;
            }
        }
        card[i].available = false;
        card[i].status = true;
        // movement
        $("#"+card[i].id).css({
            "top": String(top)+"px",
            "left": String(left)+"px",
            "transform": "rotate(0deg)"
        }).on("transitionend", function() {
            $("#"+card[i].id).removeClass("back");
        });
        // end movement
        $("#"+card[i].id).removeClass("available");
        setTimeout(update, 1200);
    }

    // ジョーカー用の関数(まず、カード一覧を受け取る)
    // ジョーカーとジョーカーの次に選んだカードの通し番号を受け取る
    // ジョーカーを使った人の勝利判定も行う
    function joker(card, jn, n) {
        if(checkFieldVacancy(n) == 1) {
            var temp = n;
            // 7より小さいカードを受け取ったら
            if(card[n].num < 6) {
                while(1) {
                    temp += 1;
                    if(card[temp].status == false) {
                        break;
                    }
                }
            // 7より大きいカードを受け取ったら
            } else {
                while(1) {
                    temp -= 1;
                    if(card[temp].status == false) {
                        break;
                    }
                }
            }
            // 共通の処理
            emit(card, jn);
            $("#"+card[jn].id).css({"display": "none"});
            emit(card, n);
            setTimeout(emit, 1200, card, temp);
            setTimeout(nextTurn, 1500);
            selectedJoker = false;
        }
    }

    // パスする関数
    function pass(playerNum) {
        player[playerNum].pass += 1;
        if(player[playerNum].pass == 3) {
            player[playerNum].gameover = true;
            gameover(playerNum);
        }
        if(turn == 0) {
            message("パス");
        } else {
            setTimeout(message, 1000, "パス");
        }
        setTimeout(update, 1200);
        nextTurn();
    }

    // メッセージを表示する
    function message(string) {
        $("#message").html(string);
        $("#message")
            .animate({"left": String((fieldW-600)/2)+"px"}, 200)
            .animate({"left": String((fieldW-600)/2)+"px"}, 600) // 一時停止
            .animate({"left": String(fieldW)+"px"}, 200)
            .animate({"left": "-600px"}, 0);
    }

    // ターンを進める
    function nextTurn() {
        turn += 1;
        if(turn == 4) {
            turn = 0;
        }
        // 次のターンの人がクリアしているかゲームオーバーなら
        if(player[turn].clear == true || player[turn].gameover == true) {
            nextTurn();
        }
    }

    // ゲームオーバーになったら呼ばれる関数
    function gameover(playerNum) {
        player[playerNum].gameover = true;
        for(var i = 0; i < player[playerNum].card.length; i++) {
            emit(card, player[playerNum].card[i]);
        }
        // 順位を決める
        for(j = ranking.length-1; 0 <= j; j--) {
            if(ranking[j] == -1) {
                ranking[j] = playerNum;
                break;
            }
        }
        if(enumeratePlayer() == 1) {
            clearInterval(MAIN);
            setTimeout(finishGame, 3000);
        }
        for(var i = 52; i < 52+numOfJoker; i++) {
            if(card[i].owner == playerNum) {
                $("#"+card[i].id).css({"display": "none"});
            }
        }
    }

    // ゲームクリアしたら呼ばれる関数
    function gameClear(playerNum) {
        player[playerNum].clear = true;
        for(var i = 0; i < ranking.length; i++) {
            if(ranking[i] == -1) {
                ranking[i] = playerNum;
                break;
            }
        }
        if(enumeratePlayer() == 1) {
            clearInterval(MAIN);
            setTimeout(finishGame, 3000);
        }
    }

    // ゲーム中のプレイヤーの人数を数える
    function enumeratePlayer() {
        var count = 0;
        for(var i = 0; i < ranking.length; i++) {
            if(ranking[i] == -1) {
                count += 1;
            }
        }
        return count;
    }

    // ゲームが終了したら呼ばれる関数
    function finishGame() {
        // ランキングを決める
        var temp = 6;
        for(var i = 0; i < 4; i++) {
            if(ranking[i] != -1) {
                temp -= ranking[i];
            }
        }
        for(var i = 0; i < ranking.length; i++) {
            if(ranking[i] == -1) {
                ranking[i] = temp;
            }
        }
        // 画面の切り替え
        $("#information").css({"display": "none"});
        $("#message").css({"display": "none"});
        $("#cardSpace").css({"display": "none"});
        $("#result").css({"display": "inline-block"});
        // 順位を表示
        var gameResult = "";
        for(var i = 0; i < ranking.length; i++) {
            gameResult += String(i+1)+"位 ";
            if(ranking[i] == 0) {
                gameResult += "YOU!";
            } else {
                gameResult += "CPU"+String(ranking[i]);
            }
            gameResult +="<br>";
        }
        $("#ranking").html(gameResult);
    }

    // 場に出すカードを選ぶ (なければ: -1)
    function selectCard(turn) {
        var hand = player[turn].card.concat();
        for(var i = 0; i < hand.length; i++) { // 出せないカードを除外
            if(card[hand[i]].available == false) {
                hand.splice(i, 1);
                i -= 1;
            }
        }
        // 誰かがゲームオーバーになったあと
        // フィールドに空きがないかを確認し、あれば hand から除外
        var candidate = [];
        for(var i = 0; i < hand.length; i++) {
            if(checkFieldVacancy(hand[i]) == 0) {
                candidate.push(i);
            }
        }
        // カードを選ぶ
        if(0 < hand.length && 0 < candidate.length) {
            var temp;
            temp  = parseInt(Math.random()* candidate.length);
            return hand[candidate[temp]];
        } else {
            return -1;
        }
    }

    // フィールドに隙間がないかをチェックする関数
    // 空きの数を返す
    function checkFieldVacancy(hand) { // hand[i] = hand
        var vnum = 0;                  // 空きの数を数える変数
        var num = card[hand].num;
        var count = (num <= 6)? 6-num: num-6;
        var j = 1;
        if(0 <= num && num < 6) {
            while(j < count) {
                if(card[hand+j].status == false) vnum += 1;
                j += 1;
            }
            return vnum;
        }
        else if(7 <= num && num < 13) {
            while(j < count) {
                if(card[hand-j].status == false) vnum += 1;
                j += 1;
            }
            return vnum;
        }
    }

    // 配列の中にある受け取った値と同じ要素を削除する
    function delete_at(array, num) {
        for(var i = 0; i < array.length; i++) {
            if(array[i] == num) {
                array.splice(i, 1);
            }
        }
    }

    // 空きの数を受け取りそれに応じた
    // 自分の手札のすぐ出せるカードに色をつける
    function setMark(vacancy) {
        // 自分の出せるカードに色をつける
        for(var i = 0; i < 52; i++) {
            var id = "#"+card[i].id;
            $(id).removeClass("available");
            if(card[i].owner == 0 && checkFieldVacancy(i) == vacancy
               && card[i].status == false) {
                $(id).addClass("available");
            }
        }
        for(var i = 52; i < 52+numOfJoker; i++) {
            var id = "#"+card[i].id;
            $(id).removeClass("available");
            if(selectedJoker == true) {
                $(id).addClass("available");
            }
        }
    }

    // tミリ秒スリープ
    function sleep(t) {
        var d1 = new Date().getTime();
        var d2 = new Date().getTime();
        while(d2 < d1+t) {
            d2 = new Date().getTime();
        }
        return;
    }
}

class Card {
    constructor(_num, _group, _groupN) {
        this.num = _num;
        this.group = _group;    // 赤,緑,青,黄,ジョーカー
        this.groupN = _groupN;
        this.id = this.group + String(this.num);
        this.owner;
        this.place;
        this.available = false; // すぐに場に出せる状態かどうか
        this.status = false;    // 手札にあれば false
    }
}

class Player {
    constructor(_id) {
        this.id = _id;
        this.card = [];         // カードの要素番号を入れる
        this.clear = false;     // 上がったら true
        this.gameover = false;  // ゲームオーバになったら true
        this.pass = 0;
    }
}

$(function() {
    sevens();
});

// ジョーカーを作る(めんどくさいから自分しか使えないようにする)
// マニュアル
