/**
 * 复合难度计算模块
 * 
 * 主要功能：
 * 1. 标记L/R（根据阈值T）
 * 2. 标记换手（hand_change）
 * 3. 标记同步（sync）
 * 4. 计算基础系数
 * 5. 计算复合难度
 */

/**
 * 计算复合难度和复合难占比
 * @param {number[]} an - 原始数组 [a0, a1, ..., an]
 * @param {number[]} bn - 标记数组 [b0, b1, ..., b(n+1)]，仅包含1和2
 * @param {number} T - 阈值参数
 * @returns {Object} 计算结果
 */
function calculateCompositeDifficulty(an, bn, T) {
    // 验证输入
    if (bn.length !== an.length + 1) {
        throw new Error(`bn数组长度应为${an.length + 1}，实际为${bn.length}`);
    }
    
    for (const b of bn) {
        if (b !== 1 && b !== 2) {
            throw new Error(`bn数组只能包含1和2，发现值: ${b}`);
        }
    }
    
    // 步骤1: 补0并标记L/R
    const a = [...an, 0];  // 补a(n+1)=0
    const n = a.length;
    
    // 步骤2: 标记L/R
    const marks = new Array(n).fill('');
    marks[0] = 'R';  // a0标记为R
    
    for (let i = 1; i < n; i++) {
        if (marks[i - 1] === 'R' && a[i - 1] < T) {
            marks[i] = 'L';
        } else {
            marks[i] = 'R';
        }
    }
    
    // 验证标记规则：不可能有连续两个L
    for (let i = 1; i < n; i++) {
        if (marks[i] === 'L' && marks[i - 1] === 'L') {
            console.warn(`警告：在位置${i}发现连续两个L标记，这不符合标记规则`);
        }
    }
    
    // 步骤1.1: 标记换手(hand_change)
    const handChange = new Array(n).fill(null);
    
    // 记录每个标记类型上一次出现的位置
    let lastRIndex = 0;
    let lastLIndex = null;
    
    for (let i = 1; i < n; i++) {
        if (marks[i] === 'R') {
            if (lastRIndex !== null && i !== lastRIndex) {
                if (bn[lastRIndex] !== bn[i]) {
                    handChange[i] = 1;
                } else {
                    handChange[i] = 0;
                }
            }
            lastRIndex = i;
        } else {  // marks[i] === 'L'
            if (lastLIndex !== null) {
                if (bn[lastLIndex] !== bn[i]) {
                    handChange[i] = 1;
                } else {
                    handChange[i] = 0;
                }
            }
            lastLIndex = i;
        }
    }
    
    // 步骤1.2: 标记同步(sync)
    const sync = new Array(n).fill(null);
    
    // 记录每个标记类型上两次出现的位置
    let secondLastRIndex = null;
    let secondLastLIndex = null;
    lastRIndex = null;
    lastLIndex = null;
    
    for (let i = 0; i < n; i++) {
        if (marks[i] === 'R') {
            if (secondLastRIndex !== null) {
                if (handChange[lastRIndex] !== null && handChange[i] !== null) {
                    if (handChange[lastRIndex] === handChange[i]) {
                        sync[i] = 1;
                    } else {
                        sync[i] = 0;
                    }
                }
            }
            
            secondLastRIndex = lastRIndex;
            lastRIndex = i;
            
        } else {  // marks[i] === 'L'
            if (secondLastLIndex !== null) {
                if (handChange[lastLIndex] !== null && handChange[i] !== null) {
                    if (handChange[lastLIndex] === handChange[i]) {
                        sync[i] = 1;
                    } else {
                        sync[i] = 0;
                    }
                }
            }
            
            secondLastLIndex = lastLIndex;
            lastLIndex = i;
        }
    }
    
    // 步骤3: 计算基础系数
    // 从第3个L标记开始，后面所有的元素不管是R还是L都需要观察
    const baseCoeff = new Array(n).fill(0);
    
    // 找到第三个L的位置
    let LCount = 0;
    let thirdLIndex = null;
    
    for (let i = 0; i < n; i++) {
        if (marks[i] === 'L') {
            LCount++;
            if (LCount === 3) {
                thirdLIndex = i;
                break;
            }
        }
    }
    
    if (thirdLIndex !== null) {
        // 从第三个L开始观察所有元素
        for (let i = thirdLIndex; i < n; i++) {
            if (i === thirdLIndex) {
                // 第三个L是起始点，基础系数=0
                baseCoeff[i] = 0;
                continue;
            }
            
            // 观察当前元素与上一个元素、上上个元素
            const currentMark = marks[i];
            const prevMark = i - 1 >= 0 ? marks[i - 1] : null;
            const prevPrevMark = i - 2 >= 0 ? marks[i - 2] : null;
            
            // 检查条件：当前标记与上一个标记不同，且当前标记与上上个标记相同
            if (prevMark !== null && currentMark !== prevMark &&
                prevPrevMark !== null && currentMark === prevPrevMark) {
                
                // 满足条件，检查同步标记
                if (sync[i] !== null && sync[i - 1] !== null) {
                    if (sync[i] !== sync[i - 1]) {
                        // 同步标记不同，基础系数=1
                        baseCoeff[i] = 1;
                    } else {
                        // 同步标记相同，基础系数=0
                        baseCoeff[i] = 0;
                    }
                } else {
                    // 没有同步标记，基础系数=0
                    baseCoeff[i] = 0;
                }
            } else {
                // 不满足条件，基础系数=0
                baseCoeff[i] = 0;
            }
        }
    }
    
    // 步骤4-5: 计算复合难度
    // 从第3个L标记开始计算复合难度
    let totalDifficulty = 0;
    const compositeDifficulties = new Array(n).fill(0);
    
    function getIntervalCoeff(value) {
        const thresholdLow = 15 / 130 * 1000;
        const thresholdHigh = 15 / 90 * 1000;
        
        if (value <= thresholdLow) {
            return 1.0;
        } else if (value >= thresholdHigh) {
            return 0.0;
        } else {
            return 1.0 - (value - thresholdLow) / (thresholdHigh - thresholdLow);
        }
    }
    
    if (thirdLIndex !== null) {
        for (let i = thirdLIndex; i < n; i++) {
            const aCoeff = baseCoeff[i];
            
            if (i >= 2) {  // 确保有a(i-1)和a(i-2)
                const bCoeffPrev1 = i - 1 >= 0 ? getIntervalCoeff(a[i - 1]) : 1.0;
                const bCoeffPrev2 = i - 2 >= 0 ? getIntervalCoeff(a[i - 2]) : 1.0;
                
                const bCoeff = bCoeffPrev1 * bCoeffPrev2;
                
                const difficulty = aCoeff * bCoeff;
                compositeDifficulties[i] = difficulty;
                totalDifficulty += difficulty;
            }
        }
    }
    
    // 计算复合难占比
    const difficultyRatio = an.length > 0 ? totalDifficulty / an.length : 0;
    
    return {
        totalDifficulty,
        difficultyRatio,
        marks,
        handChange,
        sync,
        baseCoeff,
        compositeDifficulties,
        thirdLIndex
    };
}

/**
 * 完整的复合难度计算方法（考虑T的选择）
 * @param {number[]} an - 原始数组 [a0, a1, ..., an]
 * @param {number[]} bn - 标记数组 [b0, b1, ..., b(n+1)]，仅包含1和2
 * @returns {Object} 最终计算结果
 */
function computeFinalCompositeDifficulty(an, bn) {
    // 计算阈值
    const tLow = 30 / 260 * 1000;
    const tHigh = 30 / 180 * 1000;
    const t0 = tHigh;
    const tm = tLow;
    
    console.log(`阈值范围: (${tm.toFixed(2)}, ${t0.toFixed(2)}) 开区间`);
    console.log(`t0 = ${t0.toFixed(2)}, tm = ${tm.toFixed(2)}`);
    
    // 检查数组中是否有介于(tm, t0)之间的数
    const candidateValues = [];
    for (const value of an) {
        if (tm < value && value < t0) {
            candidateValues.push(value);
        }
    }
    
    // 去重并排序（从大到小）
    const uniqueCandidates = [...new Set(candidateValues)].sort((a, b) => b - a);
    
    if (uniqueCandidates.length === 0) {
        console.log("数组中不存在严格介于(tm, t0)之间的数");
        console.log(`使用T = t0 = ${t0.toFixed(2)}`);
        const result = calculateCompositeDifficulty(an, bn, t0);
        return {
            finalDifficulty: result.totalDifficulty,
            finalRatio: result.difficultyRatio,
            TUsed: t0
        };
    }
    
    console.log(`找到严格介于(tm, t0)之间的数: ${uniqueCandidates.map(v => v.toFixed(2)).join(', ')}`);
    
    const TValues = [t0, ...uniqueCandidates];
    console.log(`T值列表: ${TValues.map(t => t.toFixed(2)).join(', ')}`);
    
    const difficulties = [];
    for (const T of TValues) {
        const result = calculateCompositeDifficulty(an, bn, T);
        difficulties.push(result.totalDifficulty);
        console.log(`T=${T.toFixed(2)}时的复合难度之和: ${result.totalDifficulty.toFixed(6)}`);
    }
    
    // 步骤3: 计算权重（修改为1/B-1/A的形式）
    const weights = [];
    for (let i = 0; i < TValues.length - 1; i++) {
        const A = TValues[i];
        const B = TValues[i + 1];
        const weight = 1 / B - 1 / A;
        weights.push(weight);
    }
    
    // 最后一个权重: 1/tm - 1/tn
    weights.push(1 / tm - 1 / TValues[TValues.length - 1]);
    
    console.log(`权重列表: ${weights.map(w => w.toFixed(6)).join(', ')}`);
    
    // 验证所有权重之和等于1/tm - 1/t0
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const expectedTotal = 1 / tm - 1 / t0;
    console.log(`权重总和: ${totalWeight.toFixed(6)}, 期望值(1/tm-1/t0): ${expectedTotal.toFixed(6)}`);
    
    // 步骤4: 计算加权几何平均值
    let weightedGeometric;
    if (totalWeight <= 0) {
        // 如果所有权重非正，则返回第一个难度值
        weightedGeometric = difficulties[0];
    } else {
        // 计算加权几何平均值
        let weightedSumLog = 0;
        let hasZeroDifficulty = false;
        
        for (let i = 0; i < difficulties.length; i++) {
            if (difficulties[i] > 0) {
                weightedSumLog += Math.log(difficulties[i]) * weights[i];
            } else {
                // 如果难度为0或负数，几何平均数为0
                hasZeroDifficulty = true;
                break;
            }
        }
        
        if (hasZeroDifficulty) {
            weightedGeometric = 0;
        } else {
            weightedGeometric = Math.exp(weightedSumLog / totalWeight);
        }
    }
    
    // 步骤5: 计算复合难占比
    const finalRatio = an.length > 0 ? weightedGeometric / an.length : 0;
    
    console.log(`加权几何平均复合难度之和: ${weightedGeometric.toFixed(6)}`);
    console.log(`最终复合难占比: ${finalRatio.toFixed(6)}`);
    
    return {
        finalDifficulty: weightedGeometric,
        finalRatio: finalRatio,
        TUsed: "加权几何平均"
    };
}

module.exports = {
    calculateCompositeDifficulty,
    computeFinalCompositeDifficulty
};