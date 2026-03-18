/**
 * 体力难度计算模块
 * 
 * 主要功能：
 * 1. 查找所有可能的体力段（累计和>=20000的最小区间）
 * 2. 找到两个不重叠的体力段，使其包含的元素数量最大
 * 3. 计算体力密度A和休息密度B
 * 4. 计算加权平方平均值
 */

/**
 * 查找所有可能的体力段
 * @param {number[]} arr - 输入数组
 * @returns {Array<{start: number, end: number, sum: number}>} 体力段数组
 */
function findSegments(arr) {
    const n = arr.length;
    const segments = []; // 存储所有体力段的起始和结束索引
    
    for (let i = 0; i < n; i++) {
        let currentSum = 0;
        for (let j = i; j < n; j++) {
            currentSum += arr[j];
            if (currentSum >= 20000) {
                // 检查是否满足条件：加上前一个元素时还小于20000
                let prevSum = 0;
                if (j > i) {
                    prevSum = arr.slice(i, j).reduce((a, b) => a + b, 0);
                }
                
                if (prevSum < 20000) {
                    segments.push({ start: i, end: j, sum: currentSum });
                }
                break;
            }
        }
    }
    
    return segments;
}

/**
 * 找到两个不重叠的体力段，使其包含的元素数量最大
 * @param {number[]} arr - 输入数组
 * @param {Array<{start: number, end: number, sum: number}>} segments - 体力段数组
 * @returns {Array<{start: number, end: number, sum: number}>|null} 最佳的两个体力段
 */
function findBestTwoSegments(arr, segments) {
    let maxTotalLength = 0;
    let bestSegments = null;
    
    const n = segments.length;
    
    // 尝试所有可能的体力段组合
    for (let i = 0; i < n; i++) {
        const seg1 = segments[i];
        const length1 = seg1.end - seg1.start + 1;
        
        for (let j = i + 1; j < n; j++) {
            const seg2 = segments[j];
            const length2 = seg2.end - seg2.start + 1;
            
            // 检查两个体力段是否重叠
            if (seg1.end < seg2.start || seg2.end < seg1.start) {
                // 不重叠
                const totalLength = length1 + length2;
                if (totalLength > maxTotalLength) {
                    maxTotalLength = totalLength;
                    bestSegments = [seg1, seg2];
                }
            }
        }
    }
    
    return bestSegments;
}

/**
 * 主计算函数
 * @param {number[]} arr - 输入数组
 * @returns {{A: number, B: number, result: number}} 计算结果
 */
function calculateResult(arr) {
    // 步骤1：查找所有可能的体力段
    const segments = findSegments(arr);
    
    if (segments.length < 2) {
        throw new Error("需要至少两个体力段");
    }
    
    // 步骤2：找到最佳的两个不重叠体力段
    const bestSegments = findBestTwoSegments(arr, segments);
    
    if (!bestSegments) {
        throw new Error("找不到两个不重叠的体力段");
    }
    
    const [seg1, seg2] = bestSegments;
    
    // 计算两个体力段的总和和元素数量
    const seg1Elements = seg1.end - seg1.start + 1;
    const seg2Elements = seg2.end - seg2.start + 1;
    const totalElementsInSegments = seg1Elements + seg2Elements;
    const totalSumInSegments = seg1.sum + seg2.sum;
    
    // 步骤3：计算体力密度A
    const A = totalSumInSegments > 0 ? (totalElementsInSegments / totalSumInSegments * 1000) : 0;
    
    // 步骤4：计算休息段
    // 找出休息段的索引
    const restIndices = [];
    for (let i = 0; i < arr.length; i++) {
        if (!((seg1.start <= i && i <= seg1.end) || (seg2.start <= i && i <= seg2.end))) {
            restIndices.push(i);
        }
    }
    
    let B = 0;
    if (restIndices.length > 0) {
        const restSum = restIndices.reduce((sum, i) => sum + arr[i], 0);
        B = restIndices.length / restSum * 1000;
    }
    
    // 步骤5：计算加权平方平均值
    const result = Math.sqrt(0.9 * A * A + 0.1 * B * B);
    
    return { A, B, result };
}

module.exports = {
    calculateResult,
    findSegments,
    findBestTwoSegments
};