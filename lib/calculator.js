// 导入计算模块
const { calculateResult } = require('./stamina.js');
const { computeFinalCompositeDifficulty } = require('./complex.js');
const { computeFinalRhythmDifficulty } = require('./rhythm.js');
const { computeWeightedAverage } = require('./speed.js');

/**
 * 从谱面数据提取间隔数组
 */
function extractIntervals(unbranched) {
    const intervals = [];
    
    if (!unbranched || !Array.isArray(unbranched)) {
        return intervals;
    }
    
    for (const segment of unbranched) {
        if (segment && Array.isArray(segment)) {
            for (const interval of segment) {
                if (interval !== null && interval !== undefined && interval > 0) {
                    intervals.push(interval);
                }
            }
        }
    }
    
    return intervals;
}

/**
 * 生成bn数组（简化版，交替1和2）
 */
function generateBnArray(length) {
    const bn = [];
    for (let i = 0; i < length; i++) {
        bn.push(i % 2 === 0 ? 1 : 2);
    }
    return bn;
}

/**
 * 计算单个难度的所有定数
 */
function calculateDifficultyRatings(unbranched) {
    const intervals = extractIntervals(unbranched);
    
    if (intervals.length === 0) {
        return {
            stamina: 0,
            complex: 0,
            rhythm: 0,
            speed: 0,
            error: '无有效数据',
            debug: { intervals: [] }
        };
    }
    
    const results = {
        stamina: 0,
        complex: 0,
        rhythm: 0,
        speed: 0,
        errors: [],
        debug: { intervals: intervals.slice(0, 10) } // 只保存前10个用于调试
    };
    
    // 计算体力定数
    try {
        const staminaResult = calculateResult(intervals);
        results.stamina = staminaResult.result;
        results.debug.staminaFull = staminaResult;
    } catch (e) {
        results.errors.push(`体力: ${e.message}`);
        results.stamina = 0;
    }
    
    // 计算复合定数
    try {
        const bn = generateBnArray(intervals.length + 1);
        const complexResult = computeFinalCompositeDifficulty(intervals, bn);
        results.complex = complexResult.finalDifficulty;
        results.debug.complexFull = complexResult;
    } catch (e) {
        results.errors.push(`复合: ${e.message}`);
        results.complex = 0;
    }
    
    // 计算节奏定数
    try {
        const rhythmResult = computeFinalRhythmDifficulty(intervals);
        results.rhythm = rhythmResult.finalDifficulty;
        results.debug.rhythmFull = rhythmResult;
    } catch (e) {
        results.errors.push(`节奏: ${e.message}`);
        results.rhythm = 0;
    }
    
    // 计算高速定数
    try {
        const speedResult = computeWeightedAverage(intervals);
        results.speed = speedResult;
        results.debug.speedFull = speedResult;
    } catch (e) {
        results.errors.push(`高速: ${e.message}`);
        results.speed = 0;
    }
    
    return results;
}

/**
 * 计算歌曲所有谱面分支的定数
 */
function calculateSongCharts(songData) {
    const charts = [];

    if (!songData || !songData.courses) {
        return charts;
    }

    const courses = songData.courses;

    for (const [difficultyName, difficultyData] of Object.entries(courses)) {
        if (!difficultyData || typeof difficultyData !== 'object') {
            continue;
        }

        for (const [branchType, branchData] of Object.entries(difficultyData)) {
            if (!Array.isArray(branchData)) {
                continue;
            }

            const ratings = calculateDifficultyRatings(branchData);
            charts.push({
                difficulty: difficultyName,
                baseDifficulty: difficultyName === 'edit' ? 'oni' : difficultyName,
                isUra: difficultyName === 'edit',
                branchType,
                ratings
            });
        }
    }

    return charts;
}

/**
 * 批量计算多首歌曲
 */
function calculateBatch(songsWithData, onProgress) {
    const results = [];
    let processed = 0;
    
    for (const song of songsWithData) {
        try {
            const charts = calculateSongCharts(song.data);
            
            results.push({
                category: song.category,
                songName: song.songName,
                charts
            });
        } catch (error) {
            console.error(`计算 ${song.songName} 失败:`, error);
            results.push({
                category: song.category,
                songName: song.songName,
                charts: [],
                error: error.message
            });
        }
        
        processed++;
        if (onProgress) {
            onProgress(processed, songsWithData.length);
        }
    }
    
    return results;
}

module.exports = {
    extractIntervals,
    generateBnArray,
    calculateDifficultyRatings,
    calculateSongCharts,
    calculateBatch
};