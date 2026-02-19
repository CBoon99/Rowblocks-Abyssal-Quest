const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build configuration...\n');

// Check 1: No .js files in src (should only be .ts)
const srcFiles = [];
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !filePath.includes('node_modules')) {
            walkDir(filePath);
        } else if (file.endsWith('.js')) {
            srcFiles.push(filePath);
        }
    }
}
walkDir('./src');
if (srcFiles.length > 0) {
    console.log('❌ Found .js files in src (should be deleted):');
    srcFiles.forEach(f => console.log('   ', f));
} else {
    console.log('✅ No .js files in src directory');
}

// Check 2: Critical methods exist
const mainTs = fs.readFileSync('./src/main.ts', 'utf-8');
const blockTs = fs.readFileSync('./src/systems/BlockPuzzleSystem.ts', 'utf-8');
const gameTs = fs.readFileSync('./src/systems/Game.ts', 'utf-8');

const checks = [
    { name: 'main.ts calls getBlockPuzzleSystem', file: mainTs, pattern: /getBlockPuzzleSystem\(\)/ },
    { name: 'main.ts calls loadLevelBlocks', file: mainTs, pattern: /loadLevelBlocks\(\)/ },
    { name: 'BlockPuzzleSystem has public loadLevelBlocks', file: blockTs, pattern: /^\s*loadLevelBlocks\(\)/m },
    { name: 'Game.ts exports getBlockPuzzleSystem', file: gameTs, pattern: /getBlockPuzzleSystem\(\)/ },
    { name: 'main.ts connects start-btn', file: mainTs, pattern: /start-btn/ },
];

console.log('\n📋 Checking critical code patterns:');
checks.forEach(check => {
    if (check.file.match(check.pattern)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name} - MISSING!`);
    }
});

// Check 3: Build output exists
if (fs.existsSync('./dist/index.html')) {
    console.log('\n✅ dist/index.html exists');
} else {
    console.log('\n❌ dist/index.html missing');
}

if (fs.existsSync('./dist/assets')) {
    const assets = fs.readdirSync('./dist/assets');
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
        console.log(`✅ Built JS file: ${jsFiles[0]}`);
    }
}

console.log('\n✨ Verification complete!\n');
