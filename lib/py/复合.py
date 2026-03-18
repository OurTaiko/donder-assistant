import math

def calculate_composite_difficulty(an, bn, T):
    """
    计算复合难度和复合难占比
    
    参数:
    an: 原始数组 [a0, a1, ..., an]
    bn: 标记数组 [b0, b1, ..., b(n+1)]，仅包含1和2
    T: 阈值参数
    
    返回:
    total_difficulty: 复合难度之和
    difficulty_ratio: 复合难占比
    """
    # 验证输入
    if len(bn) != len(an) + 1:
        raise ValueError(f"bn数组长度应为{len(an)+1}，实际为{len(bn)}")
    
    for b in bn:
        if b not in [1, 2]:
            raise ValueError(f"bn数组只能包含1和2，发现值: {b}")
    
    # 步骤1: 补0并标记L/R
    a = an.copy()
    a.append(0)  # 补a(n+1)=0
    n = len(a)
    
    # 步骤2: 标记L/R
    marks = [''] * n
    marks[0] = 'R'  # a0标记为R
    
    for i in range(1, n):
        if marks[i-1] == 'R' and a[i-1] < T:
            marks[i] = 'L'
        else:
            marks[i] = 'R'
    
    # 验证标记规则：不可能有连续两个L
    for i in range(1, n):
        if marks[i] == 'L' and marks[i-1] == 'L':
            print(f"警告：在位置{i}发现连续两个L标记，这不符合标记规则")
    
    # 步骤1.1: 标记换手(hand_change)
    hand_change = [None] * n
    
    # 记录每个标记类型上一次出现的位置
    last_R_index = 0
    last_L_index = None
    
    for i in range(1, n):
        if marks[i] == 'R':
            if last_R_index is not None and i != last_R_index:
                if bn[last_R_index] != bn[i]:
                    hand_change[i] = 1
                else:
                    hand_change[i] = 0
            last_R_index = i
        else:  # marks[i] == 'L'
            if last_L_index is not None:
                if bn[last_L_index] != bn[i]:
                    hand_change[i] = 1
                else:
                    hand_change[i] = 0
            last_L_index = i
    
    # 步骤1.2: 标记同步(sync)
    sync = [None] * n
    
    # 记录每个标记类型上两次出现的位置
    second_last_R_index = None
    second_last_L_index = None
    last_R_index = None
    last_L_index = None
    
    for i in range(n):
        if marks[i] == 'R':
            if second_last_R_index is not None:
                if hand_change[last_R_index] is not None and hand_change[i] is not None:
                    if hand_change[last_R_index] == hand_change[i]:
                        sync[i] = 1
                    else:
                        sync[i] = 0
            
            second_last_R_index = last_R_index
            last_R_index = i
            
        else:  # marks[i] == 'L'
            if second_last_L_index is not None:
                if hand_change[last_L_index] is not None and hand_change[i] is not None:
                    if hand_change[last_L_index] == hand_change[i]:
                        sync[i] = 1
                    else:
                        sync[i] = 0
            
            second_last_L_index = last_L_index
            last_L_index = i
    
    # 步骤3: 计算基础系数
    # 从第3个L标记开始，后面所有的元素不管是R还是L都需要观察
    base_coeff = [0] * n
    
    # 找到第三个L的位置
    L_count = 0
    third_L_index = None
    
    for i in range(n):
        if marks[i] == 'L':
            L_count += 1
            if L_count == 3:
                third_L_index = i
                break
    
    if third_L_index is not None:
        # 从第三个L开始观察所有元素
        for i in range(third_L_index, n):
            if i == third_L_index:
                # 第三个L是起始点，基础系数=0
                base_coeff[i] = 0
                continue
                
            # 观察当前元素与上一个元素、上上个元素
            current_mark = marks[i]
            prev_mark = marks[i-1] if i-1 >= 0 else None
            prev_prev_mark = marks[i-2] if i-2 >= 0 else None
            
            # 检查条件：当前标记与上一个标记不同，且当前标记与上上个标记相同
            if (prev_mark is not None and current_mark != prev_mark and
                prev_prev_mark is not None and current_mark == prev_prev_mark):
                
                # 满足条件，检查同步标记
                if sync[i] is not None and sync[i-1] is not None:
                    if sync[i] != sync[i-1]:
                        # 同步标记不同，基础系数=1
                        base_coeff[i] = 1
                    else:
                        # 同步标记相同，基础系数=0
                        base_coeff[i] = 0
                else:
                    # 没有同步标记，基础系数=0
                    base_coeff[i] = 0
            else:
                # 不满足条件，基础系数=0
                base_coeff[i] = 0
    
    # 步骤4-5: 计算复合难度
    # 从第3个L标记开始计算复合难度
    total_difficulty = 0
    composite_difficulties = [0] * n
    
    def get_interval_coeff(value):
        threshold_low = 15/130 * 1000
        threshold_high = 15/90 * 1000
        
        if value <= threshold_low:
            return 1.0
        elif value >= threshold_high:
            return 0.0
        else:
            return 1.0 - (value - threshold_low) / (threshold_high - threshold_low)
    
    if third_L_index is not None:
        for i in range(third_L_index, n):
            a_coeff = base_coeff[i]
            
            if i >= 2:  # 确保有a(i-1)和a(i-2)
                b_coeff_prev1 = get_interval_coeff(a[i-1]) if i-1 >= 0 else 1.0
                b_coeff_prev2 = get_interval_coeff(a[i-2]) if i-2 >= 0 else 1.0
                
                b_coeff = b_coeff_prev1 * b_coeff_prev2
                
                difficulty = a_coeff * b_coeff
                composite_difficulties[i] = difficulty
                total_difficulty += difficulty
    
    # 计算复合难占比
    difficulty_ratio = total_difficulty / len(an) if len(an) > 0 else 0
    
    return total_difficulty, difficulty_ratio, marks, hand_change, sync, base_coeff, composite_difficulties, third_L_index


def compute_final_composite_difficulty(an, bn):
    """
    完整的复合难度计算方法（考虑T的选择）
    
    参数:
    an: 原始数组 [a0, a1, ..., an]
    bn: 标记数组 [b0, b1, ..., b(n+1)]，仅包含1和2
    
    返回:
    final_difficulty: 最终复合难度之和
    final_ratio: 最终复合难占比
    """
    # 计算阈值
    t_low = 30/260 * 1000
    t_high = 30/180 * 1000
    t0 = t_high
    tm = t_low
    
    print(f"阈值范围: ({tm:.2f}, {t0:.2f}) 开区间")
    print(f"t0 = {t0:.2f}, tm = {tm:.2f}")
    
    # 检查数组中是否有介于(tm, t0)之间的数
    candidate_values = []
    for value in an:
        if tm < value < t0:
            candidate_values.append(value)
    
    candidate_values = sorted(list(set(candidate_values)), reverse=True)
    
    if not candidate_values:
        print("数组中不存在严格介于(tm, t0)之间的数")
        print(f"使用T = t0 = {t0:.2f}")
        difficulty, ratio, marks, hand_change, sync, base_coeff, composite, third_L = calculate_composite_difficulty(an, bn, t0)
        return difficulty, ratio, t0, marks, hand_change, sync, base_coeff, composite, third_L
    
    print(f"找到严格介于(tm, t0)之间的数: {candidate_values}")
    
    T_values = [t0] + candidate_values
    print(f"T值列表: {[f'{t:.2f}' for t in T_values]}")
    
    difficulties = []
    for i, T in enumerate(T_values):
        difficulty, _, _, _, _, _, _, _ = calculate_composite_difficulty(an, bn, T)
        difficulties.append(difficulty)
        print(f"T={T:.2f}时的复合难度之和: {difficulty:.6f}")
    
    # 步骤3: 计算权重（修改为1/B-1/A的形式）
    weights = []
    for i in range(len(T_values) - 1):
        A = T_values[i]
        B = T_values[i + 1]
        weight = 1/B - 1/A
        weights.append(weight)
    
    # 最后一个权重: 1/tm - 1/tn
    weights.append(1/tm - 1/T_values[-1])
    
    print(f"权重列表: {[f'{w:.6f}' for w in weights]}")
    
    # 验证所有权重之和等于1/tm - 1/t0
    total_weight = sum(weights)
    expected_total = 1/tm - 1/t0
    print(f"权重总和: {total_weight:.6f}, 期望值(1/tm-1/t0): {expected_total:.6f}")
    
    # 步骤4: 计算加权几何平均值
    if total_weight <= 0:
        # 如果所有权重非正，则返回第一个难度值
        weighted_geometric = difficulties[0]
    else:
        # 计算加权几何平均值
        weighted_sum_log = 0
        for i, difficulty in enumerate(difficulties):
            if difficulty > 0:  # 只处理正数
                weighted_sum_log += math.log(difficulty) * weights[i]
            else:
                # 如果难度为0或负数，几何平均数为0
                weighted_geometric = 0
                break
        else:
            # 如果所有难度都为正数
            weighted_geometric = math.exp(weighted_sum_log / total_weight)
    
    # 步骤5: 计算复合难占比
    final_ratio = weighted_geometric / len(an) if len(an) > 0 else 0
    
    print(f"加权几何平均复合难度之和: {weighted_geometric:.6f}")
    print(f"最终复合难占比: {final_ratio:.6f}")
    
    return weighted_geometric, final_ratio, "加权几何平均", None, None, None, None, None


# 测试函数
def test_composite_difficulty():
    """测试复合难度计算"""
    
    print("复合难度计算测试")
    print("=" * 60)
    
    # 测试1: 验证标记规则
    print("测试1: 验证标记规则")
    an1 = [100, 120, 80, 150, 90, 110, 130]
    bn1 = [1, 2, 1, 2, 1, 1, 2, 1]
    T1 = 100
    
    difficulty1, ratio1, marks1, hand_change1, sync1, base_coeff1, composite1, third_L1 = calculate_composite_difficulty(an1, bn1, T1)
    
    print(f"an数组: {an1}")
    print(f"T值: {T1}")
    print(f"L/R标记: {marks1}")
    print(f"标记序列: {' '.join(marks1)}")
    
    # 验证标记规则
    print("\n验证标记规则:")
    for i in range(1, len(marks1)):
        if marks1[i] == 'L':
            print(f"  a[{i}]是L，检查a[{i-1}]必须是R且a[{i-1}]<T")
            print(f"  a[{i-1}]={an1[i-1] if i-1 < len(an1) else 0}, 标记:{marks1[i-1]}, 条件: marks[{i-1}]=='R' and a[{i-1}]<{T1}")
            condition_met = marks1[i-1] == 'R' and (an1[i-1] if i-1 < len(an1) else 0) < T1
            print(f"  结果: {'满足' if condition_met else '不满足'}")
    
    print(f"\n第三个L的位置: {third_L1}")
    print(f"复合难度之和: {difficulty1:.6f}")
    print(f"复合难占比: {ratio1:.6f}")
    print()
    
    # 测试2: 演示基础系数计算
    print("测试2: 演示基础系数计算")
    an2 = [50, 120, 80, 150, 90, 110, 130, 70, 140]
    bn2 = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
    T2 = 100
    
    difficulty2, ratio2, marks2, hand_change2, sync2, base_coeff2, composite2, third_L2 = calculate_composite_difficulty(an2, bn2, T2)
    
    print(f"an数组: {an2}")
    print(f"T值: {T2}")
    print(f"L/R标记: {marks2}")
    
    if third_L2 is not None:
        print(f"\n从第三个L(索引{third_L2})开始计算:")
        for i in range(max(0, third_L2-2), len(marks2)):
            if i < third_L2:
                continue
                
            prev_mark = marks2[i-1] if i > 0 else 'N/A'
            prev_prev_mark = marks2[i-2] if i-2 >= 0 else 'N/A'
            prev_sync = sync2[i-1] if i > 0 and sync2[i-1] is not None else '-'
            curr_sync = sync2[i] if sync2[i] is not None else '-'
            base = base_coeff2[i]
            comp = f"{composite2[i]:.3f}" if composite2[i] != 0 else '0'
            
            # 分析计算逻辑
            if i == third_L2:
                analysis = "第三个L，基础系数=0"
            else:
                # 检查条件：当前标记与上一个标记不同，且当前标记与上上个标记相同
                condition_met = (prev_mark != 'N/A' and marks2[i] != prev_mark and
                                 prev_prev_mark != 'N/A' and marks2[i] == prev_prev_mark)
                
                if not condition_met:
                    analysis = f"不满足条件({marks2[i]}-{prev_mark}-{prev_prev_mark})，基础系数=0"
                else:
                    # 满足条件，检查同步标记
                    if curr_sync != '-' and prev_sync != '-':
                        if curr_sync != prev_sync:
                            analysis = f"满足条件({marks2[i]}-{prev_mark}-{prev_prev_mark})，同步标记不同({prev_sync}→{curr_sync})，基础系数=1"
                        else:
                            analysis = f"满足条件({marks2[i]}-{prev_mark}-{prev_prev_mark})，同步标记相同({curr_sync})，基础系数=0"
                    else:
                        analysis = f"满足条件({marks2[i]}-{prev_mark}-{prev_prev_mark})，缺少同步标记，基础系数=0"
            
            print(f"  a[{i}]={a2[i]:4.1f} 标记:{marks2[i]}(前:{prev_mark}, 前前:{prev_prev_mark}) 同步:{curr_sync}(前:{prev_sync}) 基础:{base} 难度:{comp} | {analysis}")
    
    print(f"\n复合难度之和: {difficulty2:.6f}")
    print(f"复合难占比: {ratio2:.6f}")
    print()
    
    # 测试3: 演示加权几何平均计算
    print("测试3: 演示加权几何平均计算")
    an3 = [120, 140, 160, 180, 200]
    bn3 = [1, 2, 1, 2, 1, 2]
    
    print(f"an数组: {an3}")
    print(f"bn数组: {bn3}")
    
    result3, ratio3, T_used3, _, _, _, _, _ = compute_final_composite_difficulty(an3, bn3)
    print(f"最终复合难度之和: {result3:.6f}")
    print(f"最终复合难占比: {ratio3:.6f}")
    print(f"使用的T值: {T_used3}")


# 演示标记规则
def explain_marking_rules():
    """演示标记规则"""
    print("标记规则演示")
    print("=" * 60)
    print("标记规则：")
    print("1. a0标记为'R'")
    print("2. 对于ai(i>=1):")
    print("   - 如果a(i-1)标记为'R'且a(i-1)<T，则ai标记为'L'")
    print("   - 否则标记为'R'")
    print()
    print("重要推论：")
    print("1. 不可能有连续两个L")
    print("   证明：如果ai是L，那么a(i-1)必须是R且a(i-1)<T")
    print("         对于a(i+1)，条件'a(i)标记为R'不满足（ai是L）")
    print("         所以a(i+1)一定标记为R")
    print()
    print("2. 标记序列总是R开头，然后可能是RL交替，但不会连续L")
    print("   可能的序列：R, R, R, ... 或 R, R, L, R, R, L, R, ...")
    print()
    print("基础系数计算新规则：")
    print("1. 只有在以下情况下才判断同步标记：")
    print("   - 当前标记与上一个标记不同")
    print("   - 当前标记与上上个标记相同")
    print("2. 如果满足条件且sync[i] != sync[i-1]，基础系数=1")
    print("3. 其他所有情况基础系数=0")
    print()


# 演示加权几何平均计算
def explain_weighted_geometric():
    """演示加权几何平均计算"""
    print("加权几何平均计算演示")
    print("=" * 60)
    print("权重计算公式：weight = 1/B - 1/A")
    print("其中A和B是相邻的T值")
    print("最后一个权重：weight = 1/tm - 1/tn")
    print("所有权重之和：sum(weights) = 1/tm - 1/t0")
    print()
    print("加权几何平均值计算公式：")
    print("exp(∑(w_i * log(difficulty_i)) / ∑w_i)")
    print("其中w_i是权重，difficulty_i是对应的复合难度")
    print()
    print("注意：")
    print("1. 加权几何平均值要求所有difficulty_i > 0")
    print("2. 如果任意difficulty_i <= 0，加权几何平均值=0")
    print("3. 如果权重总和<=0，使用第一个难度值")
    print()


if __name__ == "__main__":
    # 演示标记规则
    explain_marking_rules()
    
    # 演示加权几何平均计算
    explain_weighted_geometric()
    
    # 运行测试
    test_composite_difficulty()
    
    # 创建一个简单的交互式测试
    print("\n" + "=" * 60)
    print("简单交互测试")
    print("=" * 60)
    
    # 使用固定的测试数据
    an_test = [50, 120, 80, 150, 90, 110, 130]
    bn_test = [1, 2, 1, 2, 1, 1, 2, 1]
    
    print(f"测试数据：")
    print(f"an = {an_test}")
    print(f"bn = {bn_test}")
    print(f"bn数组长度: {len(bn_test)} (应为{len(an_test)+1})")
    
    try:
        # 注意：测试函数中使用了a2变量，这里需要定义
        global a2
        a2 = an_test.copy()
        a2.append(0)  # 补0
        
        result, ratio, T_used, marks, hand_change, sync, base_coeff, composite, third_L = compute_final_composite_difficulty(an_test, bn_test)
        
        print(f"\n计算结果：")
        print(f"最终复合难度之和: {result:.6f}")
        print(f"最终复合难占比: {ratio:.6f}")
        print(f"使用的T值: {T_used}")
        
    except Exception as e:
        print(f"计算错误: {e}")