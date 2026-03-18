/**
 * 高速难度计算模块
 * 
 * 主要功能：
 * 1. 计算相邻元素之和 b_i = a_i + a_{i+1}
 * 2. 计算倒数 c_i = 1000 / b_i
 * 3. 对c排序并计算排名（从1开始）
 * 4. 计算排名百分比 p_i = rank[i] / n
 * 5. 计算权重 w_i（p_i < 0.75 时为0，否则使用正弦函数）
 * 6. 计算加权平均值
 */

/**
 * 计算加权平均值
 * @param {number[]} a - 长度为 n+1 的数组
 * @returns {number} 加权平均值
 */
function computeWeightedAverage(a) {
    const n = a.length - 1;
    if (n <= 0) {
        throw new Error("数组长度必须至少为2");
    }
    
    // 1. 计算 b_i = a_i + a_{i+1}
    const b = [];
    for (let i = 0; i < n; i++) {
        b.push(a[i] + a[i + 1]);
    }
    
    // 2. 计算 c_i = 1000 / b_i
    const c = b.map(bi => 1000.0 / bi);
    
    // 3. 对c排序并计算排名 (从1开始，不重复排名)
    // 先得到排序后的索引: 从小到大排序
    const sortedIndices = c
        .map((value, index) => ({ value, index }))
        .sort((a, b) => a.value - b.value)
        .map(item => item.index);
    
    // 初始化排名数组
    const rank = new Array(n);
    for (let rankNum = 0; rankNum < sortedIndices.length; rankNum++) {
        const idx = sortedIndices[rankNum];
        rank[idx] = rankNum + 1;  // 排名从1开始
    }
    
    // 4. 排名百分比 p_i = rank[i] / n
    const p = rank.map(r => r / n);
    
    // 5. 计算权重 w_i
    const w = [];
    for (const pi of p) {
        if (pi < 0.75) {
            w.push(0.0);
        } else {
            // w_i = 1.0 + sin(5*pi*p_i - 17/4*pi)
            const wi = 1.0 + Math.sin(5 * Math.PI * pi - 17/4 * Math.PI);
            w.push(wi);
        }
    }
    
    // 6. 计算加权平均值
    let numerator = 0;
    for (let i = 0; i < w.length; i++) {
        numerator += w[i] * c[i];
    }
    
    const denominator = w.reduce((sum, wi) => sum + wi, 0);
    
    if (Math.abs(denominator) < 1e-12) {
        return 0.0;  // 所有权重为0，无法计算加权平均
    }
    
    const weightedAvg = numerator / denominator;
    return weightedAvg;
}

module.exports = {
    computeWeightedAverage
};