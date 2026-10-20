(function () {
  "use strict";
  if (new URLSearchParams(location.search).get("unit") !== "2-1") return;

  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const N = (value) => `<mn>${escape(value)}</mn>`;
  const I = (value) => `<mi>${escape(value)}</mi>`;
  const O = (value) => `<mo>${escape(value)}</mo>`;
  const R = (...parts) => `<mrow>${parts.join("")}</mrow>`;
  const P = (base, exponent) => `<msup>${base}${exponent}</msup>`;
  const D = (top, bottom) => `<mfrac>${top}${bottom}</mfrac>`;
  const bracket = (open, body, close) => {
    const size = body.includes("<mfrac>") ? (open === "[" ? "1.75em" : "1.5em")
      : /<msup>|<msqrt>|<mroot>/.test(body) ? "1.25em" : "1em";
    const fence = (glyph) => "<mo fence=\"true\" stretchy=\"false\" style=\"font-size:" + size + "\">" + glyph + "</mo>";
    return R(fence(open), body, fence(close));
  };
  const Q = (body) => bracket("(", body, ")");
  const S = (body) => bracket("[", body, "]");
  const V = (value) => value < 0 ? R(O("−"), N(-value)) : N(value);
  const A = I("a"), B = I("b"), plus = O("+"), minus = O("−"), times = O("×"), equals = O("=");
  const root5 = `<msqrt>${N(5)}</msqrt>`;
  const math = (label, body) => `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${escape(label)}"><semantics>${R(body)}<annotation encoding="text/plain">${escape(label)}</annotation></semantics></math>`;
  const F = (label, body) => ({ label, html: math(label, body) });
  const T = (label) => ({ label, html: `<span class="text-option">${escape(label)}</span>` });
  const W = (value, errorTag, feedback) => ({ ...value, errorTag, feedback });
  const pow = (base, exponent) => P(base, V(exponent));
  const eq = (left, right) => R(left, equals, right);
  const fractionA = D(N(1), A);
  const frac = (top, bottom) => D(N(top), N(bottom));
  const fourthRoot = (body) => "<mroot>" + body + N(4) + "</mroot>";
  const questions = [];

  function addQuestion(group, part, title, prompt, promptBody, finalAnswer, answerBody, page, teacherPage, guidance, steps, originalStepNumbers = null) {
    const id = `M3-2-1-L${group}${part ? `-${part}` : ""}`;
    const source = `課本第 ${page} 頁｜2-1 指數・類題 ${group}${part ? `（${part}）` : ""}`;
    questions.push({
      id, title: `第${questions.length + 1}關・${title}`, kind: "指數律・類題", enemyRank: "指數守衛",
      enemyName: ["同底幻影", "負冪木人", "平方陣靈", "分冪陣靈", "雙底守衛", "換底幻影", "通乘陣靈"][group - 1],
      enemySigil: ["冪", "負", "方", "根", "雙", "換", "通"][group - 1],
      sourceReference: source, promptMath: math(prompt, promptBody), finalAnswer: math(finalAnswer, answerBody),
      finalCopy: `本題課本第 ${page} 頁，教師解析見第 ${teacherPage} 頁。可回看每一步，或進行不計分重練。`,
      hints: [source, guidance, "先辨識目前問的是選規則、改寫、計算，還是檢查。", "回看已通過的步驟，再檢查底數、指數與正負號。", "只完成目前這一步；下一個式子應如何寫？"],
      steps: steps.map((entry, index) => {
        const stepNumber = originalStepNumbers?.[index] ?? index + 1;
        return {
        id: `${id}-S${stepNumber}`, mission: `任務${index + 1}｜${entry[0]}`, title: entry[1], skill: index === steps.length - 1 ? "check" : "formula",
        options: [
          { id: `${id}-S${stepNumber}-correct`, html: entry[2].html, correct: true },
          { id: `${id}-S${stepNumber}-wrong-1`, html: entry[3].html, correct: false, errorTag: entry[3].errorTag, feedback: entry[3].feedback },
          { id: `${id}-S${stepNumber}-wrong-2`, html: entry[4].html, correct: false, errorTag: entry[4].errorTag, feedback: entry[4].feedback }
        ]
      }; })
    });
  }

  const multiplyLaw = F("aᵐ×aⁿ＝aᵐ⁺ⁿ", eq(R(P(A,I("m")), times, P(A,I("n"))), P(A,R(I("m"),plus,I("n")))));
  const powerLaw = F("(aᵐ)ⁿ＝aᵐⁿ", eq(P(Q(P(A,I("m"))),I("n")), P(A,R(I("m"),times,I("n")))));
  const sharedPowerLaw = F("aⁿ×bⁿ＝(ab)ⁿ", eq(R(P(A,I("n")),times,P(B,I("n"))),P(Q(R(A,times,B)),I("n"))));
  const zeroLaw = F("a⁰＝1（a≠0）",eq(pow(A,0),N(1)));
  const negativeLaw = F("a⁻ⁿ＝1/aⁿ（a≠0）",eq(P(A,R(minus,I("n"))),D(N(1),P(A,I("n")))));
  const squareDifference = F("(u＋v)(u−v)＝u²−v²",eq(R(Q(R(I("u"),plus,I("v"))),Q(R(I("u"),minus,I("v")))),R(pow(I("u"),2),minus,pow(I("v"),2))));
  const differenceSquare = F("(u−v)²＝u²−2uv＋v²",eq(pow(Q(R(I("u"),minus,I("v"))),2),R(pow(I("u"),2),minus,N(2),I("u"),I("v"),plus,pow(I("v"),2))));
  const rootLaw = F("a^(1/n)＝ⁿ√a（a＞0，n為正整數）",
    eq(P(A,D(N(1),I("n"))),"<mroot>" + A + I("n") + "</mroot>"));
  const rationalPowerLaw = F("a^(m/n)＝ⁿ√(a^m)（a＞0，n為正整數，m為整數）",
    eq(P(A,D(I("m"),I("n"))),"<mroot>" + P(A,I("m")) + I("n") + "</mroot>"));

  addQuestion(1, 1, "同底合招", "a²×a⁵", R(pow(A,2),times,pow(A,5)), "a⁷", pow(A,7), 53, 53,
    "觀察兩個底數是否相同；先查課本第53頁的同底數相乘規則。", [
      ["保留指數", "先不要算出指數，哪一式正確？", F("a²×a⁵＝a²⁺⁵",eq(R(pow(A,2),times,pow(A,5)),P(A,R(N(2),plus,N(5))))),
        W(F("a²×a⁵＝a²×⁵",eq(R(pow(A,2),times,pow(A,5)),P(A,R(N(2),times,N(5))))),"指數運算","同底相乘時，指數應相加。"),
        W(F("a²×a⁵＝a²⁻⁵",eq(R(pow(A,2),times,pow(A,5)),P(A,R(N(2),minus,N(5))))),"指數運算","減指數對應同底數相除。")],
      ["完成計算", "算出指數後，化簡為哪一式？", F("a⁷",pow(A,7)),
        W(F("a¹⁰",pow(A,10)),"計算錯誤","回看上一式，應計算指數的和。"),
        W(F("a³",pow(A,3)),"計算錯誤","兩個指數是相加，不是相減。")]
    ], [2, 3]);

  addQuestion(1, 2, "重冪疊勁", "(a²)⁵", pow(Q(pow(A,2)),5), "a¹⁰", pow(A,10), 53, 53,
    "注意括號外的5次方作用於整個括號；先查課本第53頁的乘方再乘方規則。", [
      ["保留指數", "先保留指數乘法，應寫成哪一式？", F("(a²)⁵＝a²×⁵",eq(pow(Q(pow(A,2)),5),P(A,R(N(2),times,N(5))))),
        W(F("(a²)⁵＝a²⁺⁵",eq(pow(Q(pow(A,2)),5),P(A,R(N(2),plus,N(5))))),"指數運算","乘方再乘方時，內外指數相乘。"),
        W(F("(a²)⁵＝a⁵⁻²",eq(pow(Q(pow(A,2)),5),P(A,R(N(5),minus,N(2))))),"指數運算","括號外的次方不是與內層指數相減。")],
      ["完成計算", "算出指數後，化簡為哪一式？", F("a¹⁰",pow(A,10)),
        W(F("a⁷",pow(A,7)),"計算錯誤","回看上一式，需計算兩個指數的乘積。"),
        W(F("a³",pow(A,3)),"計算錯誤","內外兩層次方不會用相減來合併。")]
    ], [2, 3]);

  const original13 = R(pow(A,4),times,P(Q(fractionA),N(4)));
  addQuestion(1, 3, "同冪歸一", "a⁴×(1/a)⁴（a≠0）", original13, "1", N(1), 53, 53,
    "兩個因數的指數都是4，原式分母要求a不等於0。", [
      ["選規則", "同指數的兩項相乘，應選哪一條指數律？", sharedPowerLaw,
        W(multiplyLaw,"規則混淆","底數一個是a，另一個是1/a；先比較指數是否相同。"),
        W(powerLaw,"規則混淆","原式是兩個因數相乘，沒有外層次方包住整個原式。")],
      ["合併底數", "保留底數乘積，不先約分，應得到哪一式？", F("a⁴×(1/a)⁴＝(a×1/a)⁴",eq(original13,pow(Q(R(A,times,fractionA)),4))),
        W(F("a⁴×(1/a)⁴＝(a＋1/a)⁴",eq(original13,pow(Q(R(A,plus,fractionA)),4))),"底數運算","原式連接兩個因數的是乘號。"),
        W(F("a⁴×(1/a)⁴＝(a×a)⁴",eq(original13,pow(Q(R(A,times,A)),4))),"底數運算","第二個因數的底數是1/a，不能改成a。")],
      ["互為倒數", "約分並計算乘方後，結果是多少？", F("1⁴＝1",eq(pow(N(1),4),N(1))),
        W(F("a⁴",pow(A,4)),"倒數運算","a與1/a相乘時，要先約掉非零的a。"),
        W(F("0⁴＝0",eq(pow(N(0),4),N(0))),"倒數運算","非零數與它的倒數相乘不是0。")]
    ]);

  const original21 = R(pow(N(2),2),times,pow(N(2),-5),times,pow(N(2),3));
  addQuestion(2, 1, "零次歸元", "2²×2⁻⁵×2³", original21, "1", N(1), 55, "55-1",
    "負號屬於指數；可參考課本第54頁零指數定義。", [
      ["選規則", "三項底數相同且相乘，先用哪條規則？", multiplyLaw,
        W(powerLaw,"規則混淆","括號外再取次方才使用乘方再乘方。"),
        W(sharedPowerLaw,"規則混淆","這三項的指數不同，觀察相同的底數。")],
      ["保留指數", "只合併成一個次方，先不要計算指數。", F("2²×2⁻⁵×2³＝2²⁺⁽⁻⁵⁾⁺³",eq(original21,P(N(2),R(N(2),plus,Q(V(-5)),plus,N(3))))),
        W(F("2²⁺⁵⁺³",P(N(2),R(N(2),plus,N(5),plus,N(3)))),"負號遺漏","中間一項的指數帶負號。"),
        W(F("2²×⁽⁻⁵⁾×³",P(N(2),R(N(2),times,Q(V(-5)),times,N(3)))),"指數運算","同底數相乘，要合併指數的和。")],
      ["算指數", "把指數算完，尚未計算零次方。", F("2⁰",pow(N(2),0)),
        W(F("2¹⁰",pow(N(2),10)),"負號遺漏","重新計算上一式，保留負5的符號。"),
        W(F("0",N(0)),"步驟跳躍","本步只要算出指數，先保留底數與次方形式。")],
      ["零次方", "依零指數定義，這題的值是多少？", F("1",N(1)),
        W(F("0",N(0)),"零指數","非零底數的零次方不是0。"),
        W(F("2",N(2)),"零指數","零次方不是保留原底數，請查第54頁定義。")]
    ]);

  const original22 = R(pow(Q(pow(N(3),-2)),3),times,pow(N(3),7));
  addQuestion(2, 2, "負冪轉式", "(3⁻²)³×3⁷", original22, "3", N(3), 55, "55-1",
    "先處理括號外的次方，再合併相同底數。", [
      ["選順序", "先處理哪一部分？", T("先處理 (3⁻²)³ 的乘方，再與 3⁷ 相乘"),
        W(T("先把底數 3 和 3 相加"),"運算順序","原式是乘方與乘法，底數不相加。"),
        W(T("先把指數 −2 與 7 相加，忽略括號外的 3"),"運算順序","括號外的3次方仍須作用在3⁻²上。")],
      ["保留乘法", "先保留指數相乘的形式，哪一式正確？", F("3⁽⁻²⁾×³×3⁷",R(P(N(3),R(Q(V(-2)),times,N(3))),times,pow(N(3),7))),
        W(F("3⁽⁻²⁾⁺³×3⁷",R(P(N(3),R(Q(V(-2)),plus,N(3))),times,pow(N(3),7))),"指數運算","乘方再乘方時，內外指數相乘。"),
        W(F("3²×³×3⁷",R(P(N(3),R(N(2),times,N(3))),times,pow(N(3),7))),"負號遺漏","括號內的原指數是負2。")],
      ["算內部指數", "先只算括號所產生的指數。", F("3⁻⁶×3⁷",R(pow(N(3),-6),times,pow(N(3),7))),
        W(F("3⁶×3⁷",R(pow(N(3),6),times,pow(N(3),7))),"負號遺漏","負2乘正3後，符號仍為負。"),
        W(F("3⁻⁵×3⁷",R(pow(N(3),-5),times,pow(N(3),7))),"指數運算","此處是指數−2與3相乘。")],
      ["同底合併", "先不要算出指數，哪一式正確？", F("3⁻⁶⁺⁷",P(N(3),R(V(-6),plus,N(7)))),
        W(F("3⁻⁶×⁷",P(N(3),R(V(-6),times,N(7)))),"指數運算","同底數相乘時，指數要相加。"),
        W(F("3⁶⁺⁷",P(N(3),R(N(6),plus,N(7)))),"負號遺漏","合併時仍須保留負6。")],
      ["完成計算", "算出指數，得到哪個值？", F("3¹＝3",eq(pow(N(3),1),N(3))),
        W(F("3⁻¹＝1/3",eq(pow(N(3),-1),D(N(1),N(3)))),"指數計算","請重新計算負6加7。"),
        W(F("3⁰＝1",eq(pow(N(3),0),N(1))),"指數計算","負6加7不等於0。")]
    ]);

  const leftRoot = Q(R(root5,plus,N(1))), rightRoot = Q(R(root5,minus,N(1)));
  const original23 = R(pow(leftRoot,-2),times,pow(rightRoot,-2));
  addQuestion(2, 3, "共軛破陣", "(√5＋1)⁻²(√5−1)⁻²", original23, "1/16", D(N(1),N(16)), 55, "55-1",
    "觀察兩個括號的指數相同，也觀察括號內的加減結構。", [
      ["選規則", "兩個括號都取−2次方，先使用哪一條規則？", sharedPowerLaw,
        W(multiplyLaw,"規則混淆","兩項的底數不同，但次方相同。"),
        W(powerLaw,"規則混淆","這是兩項相乘，不是外層括號再取次方。")],
      ["合併底數", "先將兩個底數相乘，仍保留−2次方。", F("[(√5＋1)(√5−1)]⁻²",pow(Q(R(leftRoot,rightRoot)),-2)),
        W(F("[(√5＋1)＋(√5−1)]⁻²",pow(Q(R(leftRoot,plus,rightRoot)),-2)),"底數運算","原式是相乘，不是相加。"),
        W(F("[(√5＋1)(√5−1)]⁻⁴",pow(Q(R(leftRoot,rightRoot)),-4)),"指數運算","同指數合併底數後，外層仍是原來的−2次方。")],
      ["平方差", "先只算括號內的乘積，哪一式正確？", F("(5−1)⁻²＝4⁻²",eq(pow(Q(R(N(5),minus,N(1))),-2),pow(N(4),-2))),
        W(F("(5＋1)⁻²＝6⁻²",eq(pow(Q(R(N(5),plus,N(1))),-2),pow(N(6),-2))),"平方差","一加一減的共軛乘積，應用平方差。"),
        W(F("(√5−1)⁻²",pow(rightRoot,-2)),"平方差","兩個括號都須參與相乘。")],
      ["負指數", "將負指數改成正指數的分數，尚未計算。", F("1/4²",D(N(1),pow(N(4),2))),
        W(F("−1/4²",R(minus,D(N(1),pow(N(4),2)))),"負指數","負指數表示倒數，不表示整個值為負。"),
        W(F("4²",pow(N(4),2)),"負指數","取倒數時，不可丟掉分母。")],
      ["完成計算", "計算分母後，這題的值是多少？", F("1/16",D(N(1),N(16))),
        W(F("1/8",D(N(1),N(8))),"乘方計算","分母是4的平方。"),
        W(F("16",N(16)),"負指數","最後仍要保留取倒數的分數形式。")]
    ]);

  const inverse = pow(A,-1), inverseSquared = pow(A,-2);
  const original3 = eq(R(A,minus,inverse),N(4));
  addQuestion(3, null, "平方尋值", "若a−a⁻¹＝4（a＞0），求a²＋a⁻²", R(original3,O("，"),`<mtext>求 </mtext>`,pow(A,2),plus,inverseSquared), "18", N(18), 55, "55-1",
    "目標式有平方項；先思考如何從已知的差式產生平方項。", [
      ["選策略", "已知式兩邊做哪種相同操作，可產生平方項？", F("(a−a⁻¹)²＝4²",eq(pow(Q(R(A,minus,inverse)),2),pow(N(4),2))),
        W(F("a²−a⁻²＝4²",eq(R(pow(A,2),minus,inverseSquared),pow(N(4),2))),"平方展開","整個差式平方時，還會產生交叉項。"),
        W(F("(a−a⁻¹)²＝4",eq(pow(Q(R(A,minus,inverse)),2),N(4))),"等式操作","等式兩邊必須做相同的平方操作。")],
      ["展開平方", "先展開左側差式，保留乘積與平方。", F("a²−2×a×a⁻¹＋(a⁻¹)²＝4²",eq(R(pow(A,2),minus,N(2),times,A,times,inverse,plus,pow(Q(inverse),2)),pow(N(4),2))),
        W(F("a²＋2×a×a⁻¹＋(a⁻¹)²＝4²",eq(R(pow(A,2),plus,N(2),times,A,times,inverse,plus,pow(Q(inverse),2)),pow(N(4),2))),"平方展開","差的平方，中間交叉項應帶負號。"),
        W(F("a²＋(a⁻¹)²＝4²",eq(R(pow(A,2),plus,pow(Q(inverse),2)),pow(N(4),2))),"平方展開","展開平方時，還有中間的交叉項。")],
      ["倒數乘積", "只判斷交叉項中的a×a⁻¹。", F("a×a⁻¹＝1",eq(R(A,times,inverse),N(1))),
        W(F("a×a⁻¹＝0",eq(R(A,times,inverse),N(0))),"倒數運算","非零的a與其倒數相乘不會是0。"),
        W(F("a×a⁻¹＝a²",eq(R(A,times,inverse),pow(A,2))),"倒數運算","使用同底相乘，指數應為1加負1。")],
      ["重冪改寫", "只處理(a⁻¹)²，哪一式正確？", F("(a⁻¹)²＝a⁻²",eq(pow(Q(inverse),2),inverseSquared)),
        W(F("(a⁻¹)²＝a²",eq(pow(Q(inverse),2),pow(A,2))),"負號遺漏","負1與2相乘後仍為負指數。"),
        W(F("(a⁻¹)²＝a¹",eq(pow(Q(inverse),2),pow(A,1))),"指數運算","乘方再乘方，指數應相乘。")],
      ["代回等式", "把兩個局部結果代回平方展開式。", F("a²−2＋a⁻²＝16",eq(R(pow(A,2),minus,N(2),plus,inverseSquared),N(16))),
        W(F("a²＋2＋a⁻²＝16",eq(R(pow(A,2),plus,N(2),plus,inverseSquared),N(16))),"正負號","原式是差的平方，中間交叉項仍為負。"),
        W(F("a²−2＋a⁻²＝4",eq(R(pow(A,2),minus,N(2),plus,inverseSquared),N(4))),"平方計算","已知式右側也經過平方。")],
      ["移項完成", "移項後，求得的目標值是多少？", F("a²＋a⁻²＝18",eq(R(pow(A,2),plus,inverseSquared),N(18))),
        W(F("a²＋a⁻²＝14",eq(R(pow(A,2),plus,inverseSquared),N(14))),"移項符號","把左側的負2移到右側時，符號會如何改變？"),
        W(F("a²−a⁻²＝18",eq(R(pow(A,2),minus,inverseSquared),N(18))),"目標式","請重新讀題，目標式兩項之間是加號。")]
    ]);

  // 課本第57頁類題4；例4只供學生查閱與教師核對，不作為遊戲題目。
  const q41 = fourthRoot(pow(N(2),20));
  addQuestion(4, 1, "根式換形", "⁴√(2²⁰)", q41, "32", N(32), 57, 57,
    "查課本第56頁分數指數的定義；根號左上角的4是根指數。", [
      ["根式改寫", "先改寫為分數指數，不先約分，哪一式正確？",
        F("⁴√(2²⁰)＝2^(20/4)", eq(q41,P(N(2),frac(20,4)))),
        W(F("2^(20×4)",P(N(2),R(N(20),times,N(4)))),"根指數","開四次方時，原指數應除以4。"),
        W(F("2^(20−4)",P(N(2),R(N(20),minus,N(4)))),"根指數","根指數不是從原指數減去。")],
      ["計算指數", "只算分數指數，暫不計算乘方。",
        F("2⁵",pow(N(2),5)),
        W(F("2¹⁶",pow(N(2),16)),"指數運算","請重新計算20除以4。"),
        W(F("2⁸⁰",pow(N(2),80)),"指數運算","開根號對應除法，不是乘法。")],
      ["完成乘方", "計算2的五次方，得到哪個值？",
        F("32",N(32)),
        W(F("10",N(10)),"乘方計算","五次方表示連乘五個2，不是2乘5。"),
        W(F("25",N(25)),"乘方計算","請逐次計算2的乘方。")]
    ]);

  const threeFourth = frac(3,4);
  const q42 = P(N(81),threeFourth);
  addQuestion(4, 2, "分冪化整", "81^(3/4)", q42, "27", N(27), 57, 57,
    "先想81是哪個整數的四次方，再用乘方再乘方的規則。", [
      ["改寫底數", "只把81改成四次方，指數3/4先保留。",
        F("(3⁴)^(3/4)",P(Q(pow(N(3),4)),threeFourth)),
        W(F("(3³)^(3/4)",P(Q(pow(N(3),3)),threeFourth)),"底數改寫","3的三次方不是81。"),
        W(F("(9⁴)^(3/4)",P(Q(pow(N(9),4)),threeFourth)),"底數改寫","9的四次方不是81。")],
      ["保留乘法", "依乘方再乘方，先保留指數乘法。",
        F("3^(4×3/4)",P(N(3),R(N(4),times,Q(threeFourth)))),
        W(F("3^(4＋3/4)",P(N(3),R(N(4),plus,Q(threeFourth)))),"指數律","乘方再乘方時，內外指數應相乘。"),
        W(F("3^(4−3/4)",P(N(3),R(N(4),minus,Q(threeFourth)))),"指數律","這裡沒有同底相除，不能減指數。")],
      ["計算指數", "先只算4×(3/4)，保留次方形式。",
        F("3³",pow(N(3),3)),
        W(F("3⁴",pow(N(3),4)),"指數計算","4與分母4可以約掉，但分子3仍須保留。"),
        W(F("3^(3/4)",P(N(3),threeFourth)),"指數計算","內層的4次方仍要與外層指數相乘。")],
      ["完成乘方", "計算3的三次方，得到哪個值？",
        F("27",N(27)),
        W(F("9",N(9)),"乘方計算","9只是3的平方。"),
        W(F("81",N(81)),"乘方計算","81是原底數，不是改寫後的3³。")]
    ]);

  const fourFifths = frac(4,5);
  const q43 = P(Q(frac(64,125)),frac(1,3));
  addQuestion(4, 3, "分式開根", "(64/125)^(1/3)", q43, "4/5", fourFifths, 57, 57,
    "分子64與分母125都要開三次方；先找它們各是哪個整數的立方。", [
      ["辨識立方", "先將分子與分母都改寫為立方，外層指數不變。",
        F("(4³/5³)^(1/3)",P(Q(D(pow(N(4),3),pow(N(5),3))),frac(1,3))),
        W(F("(4³/5)^(1/3)",P(Q(D(pow(N(4),3),N(5))),frac(1,3))),"分母立方","分母125也是一個立方數。"),
        W(F("(4/5³)^(1/3)",P(Q(D(N(4),pow(N(5),3))),frac(1,3))),"分子立方","分子64也應寫成整數的立方。")],
      ["合併底數", "將分子、分母的立方合併，仍保留1/3次方。",
        F("[(4/5)³]^(1/3)",P(S(pow(Q(fourFifths),3)),frac(1,3))),
        W(F("[(5/4)³]^(1/3)",P(S(pow(Q(frac(5,4)),3)),frac(1,3))),"分數方向","原式分子是64、分母是125，順序不能顛倒。"),
        W(F("[(4/5)³]³",P(S(pow(Q(fourFifths),3)),N(3))),"分數指數","外層指數是三分之一，不是3。")],
      ["保留乘法", "乘方再乘方，先保留指數相乘的形式。",
        F("(4/5)^(3×1/3)",P(Q(fourFifths),R(N(3),times,Q(frac(1,3))))),
        W(F("(4/5)^(3＋1/3)",P(Q(fourFifths),R(N(3),plus,Q(frac(1,3))))),"指數律","內外兩層次方的指數應相乘。"),
        W(F("(4/5)^(3−1/3)",P(Q(fourFifths),R(N(3),minus,Q(frac(1,3))))),"指數律","此處不是同底相除，不能相減。")],
      ["完成計算", "算完3×(1/3)後，這題的值是多少？",
        F("4/5",fourFifths),
        W(F("5/4",frac(5,4)),"分數方向","開根後分子、分母的位置不會互換。"),
        W(F("4/15",frac(4,15)),"分數指數","3與三分之一相乘為1，底數仍是4/5。")]
    ]);

  const minusTwoPointFive = R(minus,N("2.5"));
  const q44 = P(Q(N("0.25")),minusTwoPointFive);
  addQuestion(4, 4, "小數轉冪", "(0.25)^−2.5", q44, "32", N(32), 57, 57,
    "先把0.25改成分數，再處理負指數；沿用課本的−2.5寫法。", [
      ["小數轉分數", "先只改寫底數，保留原來的負指數。",
        F("(1/4)^−2.5",P(Q(frac(1,4)),minusTwoPointFive)),
        W(F("(1/2)^−2.5",P(Q(frac(1,2)),minusTwoPointFive)),"小數換算","0.25不是二分之一。"),
        W(F("(1/5)^−2.5",P(Q(frac(1,5)),minusTwoPointFive)),"小數換算","把四分之一化成小數，再對照0.25。")],
      ["改寫底數", "將1/4改寫為2的負次方，外層指數不變。",
        F("(2^−2)^−2.5",P(Q(pow(N(2),-2)),minusTwoPointFive)),
        W(F("(2^−1)^−2.5",P(Q(pow(N(2),-1)),minusTwoPointFive)),"底數改寫","2的負一次方是二分之一，不是四分之一。"),
        W(F("(2²)^−2.5",P(Q(pow(N(2),2)),minusTwoPointFive)),"負指數","四分之一要寫成2的負次方。")],
      ["保留乘法", "依乘方再乘方，保留兩個負指數的乘法。",
        F("2^[(−2)×(−2.5)]",P(N(2),R(Q(V(-2)),times,Q(minusTwoPointFive)))),
        W(F("2^[(−2)＋(−2.5)]",P(N(2),R(Q(V(-2)),plus,Q(minusTwoPointFive)))),"指數律","乘方再乘方時，指數應相乘。"),
        W(F("2^[2×(−2.5)]",P(N(2),R(N(2),times,Q(minusTwoPointFive)))),"負號遺漏","1/4改寫成2的負二次方，負號不能漏掉。")],
      ["計算指數", "先算指數乘積，仍保留2的次方形式。",
        F("2⁵",pow(N(2),5)),
        W(F("2^−5",pow(N(2),-5)),"負負相乘","兩個負數相乘，結果應為正。"),
        W(F("2^4.5",P(N(2),N("4.5"))),"指數計算","重新計算2乘以2.5。")],
      ["完成乘方", "計算2的五次方，得到哪個值？",
        F("32",N(32)),
        W(F("16",N(16)),"乘方計算","16是2的四次方。"),
        W(F("1/32",frac(1,32)),"負號遺留","前一步的指數已算出是正5。")]
    ]);

  // 課本第58頁類題5：只使用類題原式；例5供自學與教師核對。
  const cubeL5 = "<mroot>" + R(pow(A,4),B) + N(3) + "</mroot>";
  const squareL5 = "<msqrt>" + R(A,pow(B,3)) + "</msqrt>";
  const l5Original = D(R(A,B,times,cubeL5),squareL5);
  const l5Converted = D(
    R(A,B,times,P(Q(R(pow(A,4),B)),frac(1,3))),
    P(Q(R(A,pow(B,3))),frac(1,2))
  );
  const l5Distributed = D(
    R(A,B,times,P(A,frac(4,3)),P(B,frac(1,3))),
    R(P(A,frac(1,2)),P(B,frac(3,2)))
  );
  const l5Prompt = R(eq(l5Original,R(P(A,I("x")),times,P(B,I("y")))),O("，"),"<mtext>求 </mtext>",I("x"),minus,I("y"));
  const negativeSixth = R(minus,frac(1,6));
  addQuestion(5, null, "雙底理式", "ab×∛(a⁴b)/√(ab³)＝aˣ×bʸ，求x−y（a、b＞0）", l5Prompt, "x−y＝2", eq(R(I("x"),minus,I("y")),N(2)), 58, 58,
    "先將根號改寫為分數指數，再分別整理a與b；分母的指數要相減。", [
      ["根式換形", "只把立方根與平方根改成分數指數，哪一式正確？",
        F("ab×(a⁴b)^(1/3)/(ab³)^(1/2)",l5Converted),
        W(F("ab×(a⁴b)³/(ab³)^(1/2)",D(R(A,B,times,P(Q(R(pow(A,4),B)),N(3))),P(Q(R(A,pow(B,3))),frac(1,2)))),"立方根","立方根對應三分之一次方，不是三次方。"),
        W(F("ab×(a⁴b)^(1/3)/(ab³)^(1/3)",D(R(A,B,times,P(Q(R(pow(A,4),B)),frac(1,3))),P(Q(R(A,pow(B,3))),frac(1,3)))),"平方根","分母是平方根，對應二分之一次方。")],
      ["分配指數", "把括號外的分數指數分配到各因數，哪一式正確？",
        F("ab×a^(4/3)b^(1/3)/(a^(1/2)b^(3/2))",l5Distributed),
        W(F("ab×a^(1/3)b^(1/3)/(a^(1/2)b^(3/2))",D(R(A,B,times,P(A,frac(1,3)),P(B,frac(1,3))),R(P(A,frac(1,2)),P(B,frac(3,2))))),"指數分配","立方根內a原本有四次方，外層指數要與4相乘。"),
        W(F("ab×a^(4/3)b^(1/3)/(a^(1/2)b^(1/2))",D(R(A,B,times,P(A,frac(4,3)),P(B,frac(1,3))),R(P(A,frac(1,2)),P(B,frac(1,2))))),"指數分配","分母中的b原本是三次方，平方根要作用在這個指數上。")],
      ["列出a指數", "只整理a的指數，先保留分數加減式。",
        F("x＝1＋4/3−1/2",eq(I("x"),R(N(1),plus,frac(4,3),minus,frac(1,2)))),
        W(F("x＝1＋4/3＋1/2",eq(I("x"),R(N(1),plus,frac(4,3),plus,frac(1,2)))),"分母指數","分母a的指數移到同底數的合併式時應相減。"),
        W(F("x＝1＋1/3−1/2",eq(I("x"),R(N(1),plus,frac(1,3),minus,frac(1,2)))),"原有指數","立方根中的a是四次方，轉成分數指數後不是三分之一。")],
      ["計算a指數", "算出a的指數x，結果是多少？",
        F("x＝11/6",eq(I("x"),frac(11,6))),
        W(F("x＝17/6",eq(I("x"),frac(17,6))),"分母指數","通分時請保留分母指數前的減號。"),
        W(F("x＝5/6",eq(I("x"),frac(5,6))),"分數運算","重新通分1、三分之四與二分之一。")],
      ["列出b指數", "只整理b的指數，先保留分數加減式。",
        F("y＝1＋1/3−3/2",eq(I("y"),R(N(1),plus,frac(1,3),minus,frac(3,2)))),
        W(F("y＝1＋1/3＋3/2",eq(I("y"),R(N(1),plus,frac(1,3),plus,frac(3,2)))),"分母指數","分母b的指數應相減。"),
        W(F("y＝1＋3/2−1/3",eq(I("y"),R(N(1),plus,frac(3,2),minus,frac(1,3)))),"分子分母","三分之一來自分子，二分之三來自分母，順序不可對調。")],
      ["計算b指數", "算出b的指數y，結果是多少？",
        F("y＝−1/6",eq(I("y"),negativeSixth)),
        W(F("y＝1/6",eq(I("y"),frac(1,6))),"正負號","通分後，再檢查相減結果的正負號。"),
        W(F("y＝−5/6",eq(I("y"),R(minus,frac(5,6)))),"分數運算","重新計算1加三分之一，再減二分之三。")],
      ["完成目標", "已知x與y，求題目指定的x−y。",
        F("x−y＝11/6−(−1/6)＝2",R(eq(R(I("x"),minus,I("y")),R(frac(11,6),minus,Q(negativeSixth))),equals,N(2))),
        W(F("x−y＝5/3",eq(R(I("x"),minus,I("y")),frac(5,3))),"負負相減","y為負數，代入x−y時要保留括號。"),
        W(F("x−y＝1",eq(R(I("x"),minus,I("y")),N(1))),"分數運算","先處理減去負數，再合併同分母分數。")]
    ]);
  questions.at(-1).visualHtml = '<p class="math-visual">題目條件：a、b 為正實數。</p>';

  // 課本第59頁類題6：已知2^x＝3，求4^(x−2)。
  const xPower = I("x");
  const l6Original = P(N(4),R(xPower,minus,N(2)));
  const l6Split = R(P(N(4),xPower),times,pow(N(4),-2));
  const l6Reciprocal = R(P(N(4),xPower),times,frac(1,16));
  const l6BaseTwo = R(P(Q(pow(N(2),2)),xPower),times,frac(1,16));
  const l6Grouped = R(pow(Q(P(N(2),xPower)),2),times,frac(1,16));
  const l6Prompt = R(eq(P(N(2),xPower),N(3)),O("，"),"<mtext>求 </mtext>",l6Original);
  addQuestion(6, null, "換底代入", "已知2ˣ＝3，求4^(x−2)", l6Prompt, "9/16", frac(9,16), 59, 59,
    "已知式以2為底數；先將目標式中的4改寫成2的平方。", [
      ["拆開指數", "依同底數指數律，先將x−2拆成兩項相乘。",
        F("4^(x−2)＝4ˣ×4⁻²",eq(l6Original,l6Split)),
        W(F("4^(x−2)＝4ˣ−4²",eq(l6Original,R(P(N(4),xPower),minus,pow(N(4),2)))),"指數拆分","指數中的減法，對應同底數相除或乘上負次方，不是兩個冪相減。"),
        W(F("4^(x−2)＝4ˣ×4²",eq(l6Original,R(P(N(4),xPower),times,pow(N(4),2)))),"負號遺漏","原指數中的2前面有減號。")],
      ["負指數", "只把4⁻²改寫成分數，仍保留4ˣ。",
        F("4ˣ×1/16",l6Reciprocal),
        W(F("4ˣ×16",R(P(N(4),xPower),times,N(16))),"負指數","負二次方表示取倒數，不能只算正二次方。"),
        W(F("4ˣ×1/8",R(P(N(4),xPower),times,frac(1,8))),"乘方計算","請計算4的平方後，再取倒數。")],
      ["改寫底數", "只把4寫成2²，外層x與1/16先保留。",
        F("(2²)ˣ×1/16",l6BaseTwo),
        W(F("(2⁴)ˣ×1/16",R(P(Q(pow(N(2),4)),xPower),times,frac(1,16))),"底數改寫","2的四次方不是4。"),
        W(F("(2²)^(x−2)×1/16",R(P(Q(pow(N(2),2)),R(xPower,minus,N(2))),times,frac(1,16))),"重複拆分","第一步已拆出負二次方，不可再在前一因數保留−2。")],
      ["重冪整理", "讓已知的2ˣ出現在式中，哪一式正確？",
        F("(2ˣ)²×1/16",l6Grouped),
        W(F("2^(x＋2)×1/16",R(P(N(2),R(xPower,plus,N(2))),times,frac(1,16))),"乘方再乘方","(2²)ˣ的內外指數應相乘，不是相加。"),
        W(F("2ˣ×1/16",R(P(N(2),xPower),times,frac(1,16))),"平方遺漏","4是2的平方，改寫後仍須保留這個平方。")],
      ["代入已知", "把2ˣ＝3代入，暫不算最後分數。",
        F("3²×1/16",R(pow(N(3),2),times,frac(1,16))),
        W(F("3×1/16",R(N(3),times,frac(1,16))),"平方遺漏","代入後，原來的平方仍要保留。"),
        W(F("2²×1/16",R(pow(N(2),2),times,frac(1,16))),"代入錯誤","已知2的x次方等於3，不是等於2。")],
      ["完成計算", "計算乘方與乘積，得到哪個值？",
        F("9/16",frac(9,16)),
        W(F("3/16",frac(3,16)),"乘方計算","先計算3的平方，再乘以十六分之一。"),
        W(F("9/8",frac(9,8)),"分母計算","前一步的分母是16，不是8。")]
    ]);

  // 課本第60頁類題7：沿用教師詳解的分子、分母同乘a^x方法。
  const ax = P(A,I("x")), aNegativeX = P(A,R(minus,I("x")));
  const a2x = P(A,R(N(2),I("x"))), aNegative2x = P(A,R(minus,N(2),I("x")));
  const a3x = P(A,R(N(3),I("x"))), aNegative3x = P(A,R(minus,N(3),I("x")));
  const a4x = P(A,R(N(4),I("x")));
  const l7Top = R(ax,minus,aNegativeX);
  const l7Bottom = R(a3x,minus,aNegative3x);
  const l7Original = D(l7Top,l7Bottom);
  const l7Multiplied = D(R(ax,times,Q(l7Top)),R(ax,times,Q(l7Bottom)));
  const l7Simplified = D(R(a2x,minus,N(1)),R(a4x,minus,aNegative2x));
  const l7Substituted = D(R(N(2),minus,N(1)),R(pow(N(2),2),minus,frac(1,2)));
  const l7Prompt = R(eq(a2x,N(2)),O("，"),"<mtext>求 </mtext>",l7Original);
  addQuestion(7, null, "通乘終陣", "已知a^(2x)＝2，求(aˣ−a⁻ˣ)/(a^(3x)−a⁻³ˣ)", l7Prompt, "2/7", frac(2,7), 60, 60,
    "參考課本第60頁類題7的方法二；分子分母要同乘同一個非零因數。", [
      ["上下同乘", "為了讓指數出現2x，分子分母同乘aˣ後應寫成哪一式？",
        F("aˣ(aˣ−a⁻ˣ)/[aˣ(a³ˣ−a⁻³ˣ)]",l7Multiplied),
        W(F("aˣ(aˣ−a⁻ˣ)/(a³ˣ−a⁻³ˣ)",D(R(ax,times,Q(l7Top)),l7Bottom)),"分式等值","只乘分子會改變原分式的值；分母也要乘同一因數。"),
        W(F("(aˣ−a⁻ˣ)/[aˣ(a³ˣ−a⁻³ˣ)]",D(l7Top,R(ax,times,Q(l7Bottom)))),"分式等值","只乘分母也會改變原分式的值。")],
      ["指數整理", "把同乘後的乘積展開並合併指數，得到哪一式？",
        F("(a²ˣ−1)/(a⁴ˣ−a⁻²ˣ)",l7Simplified),
        W(F("(a²ˣ−a⁻ˣ)/(a⁴ˣ−a⁻²ˣ)",D(R(a2x,minus,aNegativeX),R(a4x,minus,aNegative2x))),"負指數合併","aˣ乘a⁻ˣ時，同底相乘的指數之和為0。"),
        W(F("(a²ˣ−1)/(a⁴ˣ−a⁻⁴ˣ)",D(R(a2x,minus,N(1)),R(a4x,minus,P(A,R(minus,N(4),I("x")))))),"指數合併","分母後一項的指數是x加負3x。")],
      ["處理四倍", "先只把a⁴ˣ改寫成已知a²ˣ的乘方。",
        F("a⁴ˣ＝(a²ˣ)²",eq(a4x,pow(Q(a2x),2))),
        W(F("a⁴ˣ＝2a²ˣ",eq(a4x,R(N(2),a2x))),"乘方關係","指數加倍對應平方，不是整體乘以2。"),
        W(F("a⁴ˣ＝(a²ˣ)⁴",eq(a4x,pow(Q(a2x),4))),"指數相乘","(a²ˣ)⁴的指數會變成8x。")],
      ["處理負冪", "再只把a⁻²ˣ改寫成a²ˣ的倒數。",
        F("a⁻²ˣ＝1/a²ˣ",eq(aNegative2x,D(N(1),a2x))),
        W(F("a⁻²ˣ＝−1/a²ˣ",eq(aNegative2x,R(minus,D(N(1),a2x)))),"負指數","負指數表示取倒數，不代表整體是負數。"),
        W(F("a⁻²ˣ＝1/aˣ",eq(aNegative2x,D(N(1),ax))),"指數保留","取倒數後，分母的指數仍是2x。")],
      ["代入已知", "將a²ˣ＝2代回前面的分式，尚未算最後的值。",
        F("(2−1)/(2²−1/2)",l7Substituted),
        W(F("(2＋1)/(2²−1/2)",D(R(N(2),plus,N(1)),R(pow(N(2),2),minus,frac(1,2)))),"分子符號","上一式分子兩項之間是減號。"),
        W(F("(2−1)/(2²＋1/2)",D(R(N(2),minus,N(1)),R(pow(N(2),2),plus,frac(1,2)))),"分母符號","上一式分母兩項之間也是減號。")],
      ["計算分母", "先算分子與分母，保留複分數形式。",
        F("1/(7/2)",D(N(1),frac(7,2))),
        W(F("1/(9/2)",D(N(1),frac(9,2))),"分母運算","重新計算4減二分之一。"),
        W(F("1/(3/2)",D(N(1),frac(3,2))),"分母運算","分母含2的平方，先算乘方。")],
      ["完成分數", "最後處理複分數，求得原式的值。",
        F("2/7",frac(2,7)),
        W(F("7/2",frac(7,2)),"複分數","原式是1除以二分之七，取倒數方向要確認。"),
        W(F("1/7",frac(1,7)),"複分數","除以二分之七時，分子會乘上2。")]
    ]);

  window.MathGameData = {
    unitId: "M3-2-1", contentVersion: 2, legacyStorageKey: "math-scaffold-battle-2-1-v1", unit: "2-1 指數（類題1～7）",
    unitLabel: "第二章・2-1 指數", formulas: [multiplyLaw.html, powerLaw.html, sharedPowerLaw.html, zeroLaw.html, negativeLaw.html, rootLaw.html, rationalPowerLaw.html, squareDifference.html, differenceSquare.html], questions
  };
})();
