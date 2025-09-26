// 簡單的 Node.js 測試腳本來驗證 topic.json 格式
const fs = require('fs');
const path = require('path');

// 讀取測試 topic.json
const topicPath = path.join(__dirname, 'test-topic.json');
try {
    const topicData = fs.readFileSync(topicPath, 'utf8');
    const topic = JSON.parse(topicData);

    console.log('✅ topic.json 載入成功！');
    console.log('Topic ID:', topic.id);
    console.log('Topic Name:', topic.name);
    console.log('Display Name:', topic.displayName);
    console.log('Description:', topic.description);
    console.log('Subtopics:', topic.subtopics);
    console.log('Display Settings:', topic.display);

    // 驗證必需欄位
    const requiredFields = ['id', 'name', 'description'];
    const missing = requiredFields.filter(field => !topic[field]);

    if (missing.length > 0) {
        console.log('❌ 缺少必需欄位:', missing);
    } else {
        console.log('✅ 所有必需欄位都存在');
    }

    // 驗證 subtopics 格式
    if (topic.subtopics && Array.isArray(topic.subtopics)) {
        console.log('✅ subtopics 格式正確，包含', topic.subtopics.length, '個子主題');
    }

    // 驗證 display 設定
    if (topic.display) {
        console.log('✅ display 設定存在');
        console.log('  - Icon:', topic.display.icon);
        console.log('  - Color:', topic.display.color);
        console.log('  - Order:', topic.display.order);
    }

} catch (error) {
    console.log('❌ 載入或解析 topic.json 失敗:', error.message);
}