// 測試 for 迴圈模板格式化
const code = `for (int i = 0; i < 10; i++) {
    printf("第 %d 次迴圈\\n", i + 1);
}`;

console.log("原始模板：");
console.log(JSON.stringify(code));
console.log("原始模板顯示：");
console.log(code);

// 檢查每一行的字符
const lines = code.split('\n');
lines.forEach((line, i) => {
    console.log(`第 ${i} 行長度: ${line.length}`);
    console.log(`第 ${i} 行內容: "${line}"`);
    console.log(`第 ${i} 行字符碼:`, [...line].map(c => c.charCodeAt(0)));
});