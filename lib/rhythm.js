/**
 * 节奏难度计算模块
 * 
 * 主要功能：
 * 1. 根据阈值T标记L/R
 * 2. 分别处理左手和右手数组
 * 3. 计算节奏难度（考虑比例系数、大间隔修正、馅蜜修正）
 * 4. 支持T值加权平均计算
 */

/**
 * 处理数组，根据标记合并元素
 * @param {number[]} arr - 输入数组
 * @param {number} T - 阈值参数
 * @returns {{rArray: number[], lArray: number[]}} 处理后的左右手数组
 */
function processArray(arr, T) {
    const a = [...arr, 0];
    const n = a.length;
    
    // 标记数组
    const marks = new Array(n).fill('');
    marks[0] = 'R';
    
    for (let i = 1; i < n; i++) {
        if (marks[i - 1] === 'R' && a[i - 1] < T) {
            marks[i] = 'L';
        } else {
            marks[i] = 'R';
        }
    }
    
    // 处理右手（保留R，合并L到前一个元素）
    function processWithRightHand(inputArray, inputMarks) {
        const arrCopy = [...inputArray];
        const marksCopy = [...inputMarks];
        let i = 0;
        
        while (i < arrCopy.length) {
            if (marksCopy[i] === 'R') {
                i++;
            } else {
                if (i > 0) {
                    arrCopy[i - 1] = arrCopy[i - 1] + arrCopy[i];
                    arrCopy.splice(i, 1);
                    marksCopy.splice(i, 1);
                }
            }
        }
        
        return arrCopy;
    }
    
    // 处理左手（保留L，合并R到前一个元素）
    function processWithLeftHand(inputArray, inputMarks) {
        const arrCopy = [...inputArray];
        const marksCopy = [...inputMarks];
        let i = 0;
        
        while (i < arrCopy.length) {
            if (marksCopy[i] === 'L') {
                i++;
            } else {
                if (i > 0) {
                    arrCopy[i - 1] = arrCopy[i - 1] + arrCopy[i];
                    arrCopy.splice(i, 1);
                    marksCopy.splice(i, 1);
                } else {
                    arrCopy.splice(i, 1);
                    marksCopy.splice(i, 1);
                }
            }
        }
        
        return arrCopy;
    }
    
    const resultR = processWithRightHand(a, marks);
    const resultL = processWithLeftHand(a, marks);
    
    return { rArray: resultR, lArray: resultL };
}

/**
 * 计算单个数组的节奏难度之和
 * @param {number[]} array - 输入数组
 * @returns {number} 节奏难度之和
 */
function calculateArrayDifficulty(array) {
    if (array.length < 2) {
        return 0;  // 数组长度小于2，无法计算节奏难度
    }
    
    let totalDifficulty = 0;
    
    for (let i = 1; i < array.length; i++) {
        const ai = array[i];
        const aiPrev = array[i - 1];
        
        // 计算a系数
        let N = 0;
        if (ai !== 0 && aiPrev !== 0) {
            const larger = Math.max(ai, aiPrev);
            const smaller = Math.min(ai, aiPrev);
            const ratio = larger / smaller;
            N = ratio - Math.floor(ratio);  // 取小数部分
        }
        
        const aCoeff = 2 * Math.sqrt(0.25 - Math.pow(0.5 - N, 2));
        
        // 计算b系数（大间隔修正系数乘积）
        function getIntervalCoeff(value) {
            const thresholdLow = 30 / 130 * 1000 * 1.5;
            const thresholdHigh = 30 / 90 * 1000 * 1.5;
            
            if (value <= thresholdLow) {
                return 1.0;
            } else if (value >= thresholdHigh) {
                return 0.0;
            } else {
                // 线性插值
                return 1.0 - (value - thresholdLow) / (thresholdHigh - thresholdLow);
            }
        }
        
        const bCoeffPrev = getIntervalCoeff(aiPrev);
        const bCoeffCurrent = getIntervalCoeff(ai);
        const bCoeff = bCoeffPrev * bCoeffCurrent;
        
        // 计算c系数（馅蜜修正系数）
        function getFillingCoeff(value) {
            if (value >= 100) {
                return 1.0;
            } else if (value <= 50) {
                return 0.0;
            } else {
                // 线性插值
                return (value - 50) / 50;
            }
        }
        
        const cCoeff = getFillingCoeff(ai);
        
        // 计算节奏难度
        const difficulty = aCoeff * bCoeff * cCoeff;
        totalDifficulty += difficulty;
    }
    
    return totalDifficulty;
}

/**
 * 计算指定T值下的节奏难度和节奏难占比
 * @param {number[]} arr - 原始数组 [a0, a1, ..., an]
 * @param {number} T - 阈值参数
 * @returns {Object} 计算结果
 */
function calculateRhythmDifficulty(arr, T) {
    // 获取l和r数组
    const { rArray, lArray } = processArray(arr, T);
    
    // 计算l和r数组的节奏难度
    const lDifficulty = calculateArrayDifficulty(lArray);
    const rDifficulty = calculateArrayDifficulty(rArray);
    
    // 计算总节奏难度
    const totalDifficulty = lDifficulty + rDifficulty;
    
    // 计算节奏难占比
    const difficultyRatio = arr.length > 0 ? totalDifficulty / arr.length : 0;
    
    return {
        totalDifficulty,
        difficultyRatio,
        lArray,
        rArray
    };
}

/**
 * 完整的节奏难度计算方法
 * @param {number[]} arr - 原始数组 [a0, a1, ..., an]
 * @returns {Object} 最终计算结果
 */
function computeFinalRhythmDifficulty(arr) {
    // 计算阈值
    const tLow = 30 / 260 * 1000;
    const tHigh = 30 / 180 * 1000;
    const t0 = tHigh;
    const tm = tLow;
    
    console.log(`阈值范围: (${tm.toFixed(2)}, ${t0.toFixed(2)}) 开区间`);
    console.log(`t0 = ${t0.toFixed(2)}, tm = ${tm.toFixed(2)}`);
    
    // 检查数组中是否有介于(tm, t0)之间的数（不包含两端）
    const candidateValues = [];
    for (const value of arr) {
        if (tm < value && value < t0) {  // 严格大于tm且严格小于t0
            candidateValues.push(value);
        }
    }
    
    // 去重并排序
    const uniqueCandidates = [...new Set(candidateValues)].sort((a, b) => b - a);
    
    if (uniqueCandidates.length === 0) {
        // 没有介于中间的数，使用t0
        console.log("数组中不存在严格介于(tm, t0)之间的数");
        console.log(`使用T = t0 = ${t0.toFixed(2)}`);
        const result = calculateRhythmDifficulty(arr, t0);
        return {
            finalDifficulty: result.totalDifficulty,
            finalRatio: result.difficultyRatio,
            TUsed: t0
        };
    }
    
    // 有介于中间的数，执行加权计算
    console.log(`找到严格介于(tm, t0)之间的数: ${uniqueCandidates.map(v => v.toFixed(2)).join(', ')}`);
    
    // 步骤1: 将所有符合条件的数与t0从大到小排列
    const TValues = [t0, ...uniqueCandidates];
    console.log(`T值列表: ${TValues.map(t => t.toFixed(2)).join(', ')}`);
    
    // 步骤2: 计算每个T值对应的节奏难度之和
    const difficulties = [];
    for (const T of TValues) {
        const result = calculateRhythmDifficulty(arr, T);
        difficulties.push(result.totalDifficulty);
        console.log(`T=${T.toFixed(2)}时的节奏难度之和: ${result.totalDifficulty.toFixed(6)}`);
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
    
    // 步骤5: 计算节奏难占比
    const finalRatio = arr.length > 0 ? weightedGeometric / arr.length : 0;
    
    console.log(`加权几何平均节奏难度之和: ${weightedGeometric.toFixed(6)}`);
    console.log(`最终节奏难占比: ${finalRatio.toFixed(6)}`);
    
    return {
        finalDifficulty: weightedGeometric,
        finalRatio: finalRatio,
        TUsed: "加权几何平均"
    };
}

module.exports = {
    calculateRhythmDifficulty,
    computeFinalRhythmDifficulty,
    processArray,
    calculateArrayDifficulty
};