#!/usr/bin/env node

const path = require('path');
const { TextBricksEngine } = require('../../packages/core/dist/core/TextBricksEngine');

async function testCardLoading() {
    console.log('🧪 Testing Card Loading System');
    console.log('='.repeat(50));

    try {
        // Create a mock platform for testing
        const dataDir = path.join(__dirname, '../../data');
        const mockPlatform = {
            storage: {
                get: async (key) => {
                    console.log(`Mock storage.get called with key: ${key}`);
                    return null; // No cached data for testing
                },
                set: async (key, value) => {
                    console.log(`Mock storage.set called with key: ${key}`);
                }
            },
            logError: (error, context) => {
                console.error(`[${context}] Error:`, error.message);
            },
            getExtensionPath: () => {
                return __dirname; // Return current directory as extension path
            }
        };

        // Create engine instance with mock platform
        const engine = new TextBricksEngine(mockPlatform);

        console.log(`📁 Data directory: ${dataDir}`);

        // Initialize engine
        await engine.initialize(dataDir);

        // Test 1: Get all cards
        console.log('\n📋 Test 1: Get all cards');
        const allCards = engine.getAllCards();
        console.log(`Total cards loaded: ${allCards.length}`);

        // Group cards by type
        const cardsByType = allCards.reduce((acc, card) => {
            acc[card.type] = (acc[card.type] || 0) + 1;
            return acc;
        }, {});

        console.log('Cards by type:');
        Object.entries(cardsByType).forEach(([type, count]) => {
            const icon = type === 'topic' ? '📁' : type === 'template' ? '📄' : '🔗';
            console.log(`  ${icon} ${type}: ${count}`);
        });

        // Test 2: Show sample cards of each type
        console.log('\n🔍 Test 2: Sample cards by type');

        ['topic', 'template', 'link'].forEach(type => {
            const cards = allCards.filter(card => card.type === type);
            console.log(`\n${type.toUpperCase()} cards (${cards.length} found):`);

            cards.slice(0, 2).forEach(card => {
                console.log(`  📌 ${card.title}`);
                console.log(`     Description: ${card.description}`);
                console.log(`     Language: ${card.language}, Topic: ${card.topic}`);
                if (card.target) console.log(`     Target: ${card.target}`);
                if (card.code) console.log(`     Code: ${card.code.substring(0, 50)}...`);
                console.log();
            });
        });

        // Test 3: Check specific topic structure
        console.log('\n🏗️  Test 3: Topic structure analysis');

        const topicsByLanguage = allCards.reduce((acc, card) => {
            if (!acc[card.language]) acc[card.language] = {};
            if (!acc[card.language][card.topic]) acc[card.language][card.topic] = {
                topic: 0, template: 0, link: 0
            };
            acc[card.language][card.topic][card.type]++;
            return acc;
        }, {});

        Object.entries(topicsByLanguage).forEach(([language, topics]) => {
            console.log(`\n📚 Language: ${language}`);
            Object.entries(topics).forEach(([topic, counts]) => {
                console.log(`  📁 ${topic}: ${counts.topic} topic(s), ${counts.template} template(s), ${counts.link} link(s)`);
            });
        });

        console.log('\n✅ Card loading test completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        process.exit(1);
    }
}

testCardLoading();