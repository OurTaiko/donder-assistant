const { ipcRenderer } = require('electron');
const { calculateBatch } = require('../lib/calculator.js');

let allResults = [];
let filteredResults = [];

// DOM元素
const calculateBtn = document.getElementById('calculateBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const difficultySelect = document.getElementById('difficultySelect');
const resultsBody = document.getElementById('resultsBody');
const totalSongsEl = document.getElementById('totalSongs');
const calculatedSongsEl = document.getElementById('calculatedSongs');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const dataModal = document.getElementById('dataModal');
const retryButton = document.getElementById('retryButton');

// 当前选择的难度和排序状态
let selectedDifficulty = 'oni_plus_edit';
let currentSort = { column: null, ascending: true };

const DIFFICULTY_LABELS = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    oni: '魔王',
    edit: '魔王(里)'
};

const BRANCH_LABELS = {
    unbranched: '',
    normal: '普通',
    expert: '玄人',
    master: '达人'
};

function renderBranchType(branchType) {
    const hasBranchLabel = Object.prototype.hasOwnProperty.call(BRANCH_LABELS, branchType);
    const branchLabel = hasBranchLabel ? BRANCH_LABELS[branchType] : branchType;

    if (!branchLabel) {
        return '';
    }

    if (branchType === 'master') {
        return '<span style="color: #ff4fa0; font-weight: 600;">达人</span>';
    }

    if (branchType === 'expert') {
        return '<span style="color: #10a7d6; font-weight: 600;">玄人</span>';
    }

    return branchLabel;
}

function getDisplayRows(results) {
    const rows = [];

    for (const song of results) {
        const charts = Array.isArray(song.charts) ? song.charts : [];

        for (const chart of charts) {
            if (selectedDifficulty === 'oni_plus_edit') {
                if (chart.difficulty !== 'oni' && chart.difficulty !== 'edit') {
                    continue;
                }
            } else if (selectedDifficulty !== 'all' && chart.difficulty !== selectedDifficulty) {
                continue;
            }

            rows.push({
                category: song.category,
                songName: song.songName,
                difficulty: chart.difficulty,
                isUra: chart.isUra,
                branchType: chart.branchType,
                ratings: chart.ratings
            });
        }
    }

    return rows;
}

// 显示模态框
function showModal() {
    dataModal.classList.remove('hidden');
}

// 隐藏模态框
function hideModal() {
    dataModal.classList.add('hidden');
}

// 显示加载状态
function showLoading(text = '正在加载...') {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

// 隐藏加载状态
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// 更新进度
function updateProgress(current, total) {
    const percent = (current / total) * 100;
    progressFill.style.width = `${percent}%`;
    calculatedSongsEl.textContent = current;
}

// 自动加载数据
async function autoLoadData() {
    try {
        showLoading('正在扫描歌曲文件...');
        
        const songList = await ipcRenderer.invoke('scan-data-folder');
        
        if (songList.length === 0) {
            hideLoading();
            showModal();
            return false;
        }
        
        hideModal();
        totalSongsEl.textContent = songList.length;
        
        showLoading(`正在加载 ${songList.length} 首歌曲数据...`);
        
        const songsWithData = await ipcRenderer.invoke('load-all-songs', songList);
        
        showLoading('正在计算难度定数...');
        progressContainer.classList.remove('hidden');
        
        const results = calculateBatch(songsWithData, (current, total) => {
            updateProgress(current, total);
        });
        
        allResults = results;
        filteredResults = results;
        
        displayResults(results);
        
        exportBtn.disabled = false;
        
        hideLoading();
        progressContainer.classList.add('hidden');
        
        return true;
        
    } catch (error) {
        console.error('加载失败:', error);
        hideLoading();
        showModal();
        return false;
    }
}

// 页面加载时自动扫描
window.addEventListener('DOMContentLoaded', () => {
    autoLoadData();
});

// 重试按钮
retryButton.addEventListener('click', () => {
    hideModal();
    autoLoadData();
});

// 开始计算（保留按钮功能，用于手动重新计算）
calculateBtn.addEventListener('click', async () => {
    try {
        calculateBtn.disabled = true;
        showLoading('正在扫描歌曲文件...');
        
        // 扫描data文件夹
        const songList = await ipcRenderer.invoke('scan-data-folder');
        
        if (songList.length === 0) {
            alert('未找到任何歌曲数据');
            hideLoading();
            calculateBtn.disabled = false;
            return;
        }
        
        totalSongsEl.textContent = songList.length;
        
        showLoading(`正在加载 ${songList.length} 首歌曲数据...`);
        
        // 批量读取所有歌曲数据
        const songsWithData = await ipcRenderer.invoke('load-all-songs', songList);
        
        showLoading('正在计算难度定数...');
        progressContainer.classList.remove('hidden');
        
        // 计算所有定数
        const results = calculateBatch(songsWithData, (current, total) => {
            updateProgress(current, total);
        });
        
        allResults = results;
        filteredResults = results;
        
        // 显示结果
        displayResults(results);
        
        // 启用导出按钮
        exportBtn.disabled = false;
        
        hideLoading();
        progressContainer.classList.add('hidden');
        
    } catch (error) {
        console.error('计算失败:', error);
        alert('计算失败: ' + error.message);
        hideLoading();
    } finally {
        calculateBtn.disabled = false;
    }
});

// 显示结果 - 展示所有谱面分支（含里谱和分歧类型）
function displayResults(results) {
    const displayRows = getDisplayRows(results);
    const fragment = document.createDocumentFragment();
    
    if (displayRows.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                没有找到匹配的结果
            </td>
        `;
        fragment.appendChild(row);
        resultsBody.innerHTML = '';
        resultsBody.appendChild(fragment);
        return;
    }
    
    // 应用排序
    let sortedResults = [...displayRows];
    if (currentSort.column) {
        sortedResults.sort((a, b) => {
            const ratingsA = a.ratings;
            const ratingsB = b.ratings;
            
            let valueA, valueB;
            
            // 根据排序列获取对应的值
            if (currentSort.column === 'complex') {
                valueA = ratingsA.debug?.complexFull?.finalDifficulty || 0;
                valueB = ratingsB.debug?.complexFull?.finalDifficulty || 0;
            } else if (currentSort.column === 'complexRatio') {
                valueA = ratingsA.debug?.complexFull?.finalRatio || 0;
                valueB = ratingsB.debug?.complexFull?.finalRatio || 0;
            } else if (currentSort.column === 'rhythm') {
                valueA = ratingsA.debug?.rhythmFull?.finalDifficulty || 0;
                valueB = ratingsB.debug?.rhythmFull?.finalDifficulty || 0;
            } else if (currentSort.column === 'rhythmRatio') {
                valueA = ratingsA.debug?.rhythmFull?.finalRatio || 0;
                valueB = ratingsB.debug?.rhythmFull?.finalRatio || 0;
            } else if (currentSort.column === 'difficulty') {
                valueA = a.difficulty;
                valueB = b.difficulty;
            } else if (currentSort.column === 'isUra') {
                valueA = a.isUra ? 1 : 0;
                valueB = b.isUra ? 1 : 0;
            } else if (currentSort.column === 'branchType') {
                valueA = a.branchType;
                valueB = b.branchType;
            } else {
                valueA = ratingsA[currentSort.column] || 0;
                valueB = ratingsB[currentSort.column] || 0;
            }

            if (typeof valueA === 'string' || typeof valueB === 'string') {
                const textA = String(valueA || '');
                const textB = String(valueB || '');
                return currentSort.ascending
                    ? textA.localeCompare(textB, 'zh-CN')
                    : textB.localeCompare(textA, 'zh-CN');
            }

            const numA = Number(valueA) || 0;
            const numB = Number(valueB) || 0;

            if (currentSort.ascending) {
                return numA - numB;
            } else {
                return numB - numA;
            }
        });
    }
    
    for (const rowData of sortedResults) {
        const ratings = rowData.ratings;
        const row = document.createElement('tr');
        const difficultyLabel = DIFFICULTY_LABELS[rowData.difficulty] || rowData.difficulty;
        const branchDisplay = renderBranchType(rowData.branchType);
        const complexDifficulty = ratings.debug?.complexFull?.finalDifficulty ?? ratings.complex ?? 0;
        const complexRatio = ratings.debug?.complexFull?.finalRatio ?? 0;
        const rhythmDifficulty = ratings.debug?.rhythmFull?.finalDifficulty ?? ratings.rhythm ?? 0;
        const rhythmRatio = ratings.debug?.rhythmFull?.finalRatio ?? 0;
        
        row.innerHTML = `
            <td class="category-cell">${rowData.category}</td>
            <td class="song-cell">${rowData.songName}</td>
            <td class="rating-cell">${difficultyLabel}</td>
            <td class="rating-cell">${branchDisplay}</td>
            <td class="rating-cell">${ratings.stamina.toFixed(2)}</td>
            <td class="rating-cell">${complexDifficulty.toFixed(4)}</td>
            <td class="rating-cell"><small style="color: #666;">${complexRatio.toFixed(4)}</small></td>
            <td class="rating-cell">${rhythmDifficulty.toFixed(4)}</td>
            <td class="rating-cell"><small style="color: #666;">${rhythmRatio.toFixed(4)}</small></td>
            <td class="rating-cell">${ratings.speed.toFixed(2)}</td>
        `;
        
        row.addEventListener('click', () => {
            if (ratings.debug) {
                console.group(`🎵 ${rowData.songName} (${rowData.category})`);
                console.log('📌 谱面信息:', {
                    difficulty: rowData.difficulty,
                    isUra: rowData.isUra,
                    branchType: rowData.branchType
                });
                console.log('📊 完整返回值:', ratings);
                console.log('💪 体力定数:', ratings.debug.staminaFull);
                console.log('🔀 复合定数:', ratings.debug.complexFull);
                console.log('🎵 节奏定数:', ratings.debug.rhythmFull);
                console.log('⚡ 高速定数:', ratings.debug.speedFull);
                console.groupEnd();

                document.querySelectorAll('tbody tr').forEach(r => r.style.backgroundColor = '');
                row.style.backgroundColor = '#e3f2fd';
                setTimeout(() => {
                    row.style.backgroundColor = '';
                }, 2000);
            }
        });
        
        fragment.appendChild(row);
    }
    
    resultsBody.innerHTML = '';
    resultsBody.appendChild(fragment);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 搜索功能 - 使用防抖优化
const performSearch = debounce((searchTerm) => {
    if (searchTerm === '') {
        filteredResults = allResults;
    } else {
        filteredResults = allResults.filter(song =>
            song.songName.toLowerCase().includes(searchTerm) ||
            song.category.toLowerCase().includes(searchTerm)
        );
    }
    displayResults(filteredResults);
}, 300); // 300ms 防抖延迟

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    performSearch(searchTerm);
});

// 难度选择功能
difficultySelect.addEventListener('change', (e) => {
    selectedDifficulty = e.target.value;
    displayResults(filteredResults);
});

// 排序功能
document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
        const sortColumn = header.dataset.sort;
        
        // 切换排序方向
        if (currentSort.column === sortColumn) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = sortColumn;
            currentSort.ascending = false; // 默认降序（从高到低）
        }
        
        // 更新排序指示器
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '↕';
        });
        
        const indicator = header.querySelector('.sort-indicator');
        indicator.textContent = currentSort.ascending ? '↑' : '↓';
        
        // 重新显示结果
        displayResults(filteredResults);
    });
});

// 导出CSV
exportBtn.addEventListener('click', () => {
    if (allResults.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    try {
        const csv = generateCSV(allResults);
        downloadCSV(csv, 'taiko-ratings.csv');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
});

// 生成CSV
function generateCSV(results) {
    const headers = ['分类', '歌曲', '难度', '里谱', '谱面类型', '体力定数', '复合定数', '复合占比', '节奏定数', '节奏占比', '高速定数'];
    const rows = [headers];
    
    for (const song of results) {
        const charts = Array.isArray(song.charts) ? song.charts : [];
        for (const chart of charts) {
            const ratings = chart.ratings;
            rows.push([
                song.category,
                song.songName,
                DIFFICULTY_LABELS[chart.difficulty] || chart.difficulty,
                chart.isUra ? '是' : '否',
                BRANCH_LABELS[chart.branchType] || chart.branchType,
                ratings.stamina.toFixed(2),
                ratings.complex.toFixed(4),
                ratings.debug?.complexFull?.finalRatio?.toFixed(4) || '0.0000',
                ratings.rhythm.toFixed(4),
                ratings.debug?.rhythmFull?.finalRatio?.toFixed(4) || '0.0000',
                ratings.speed.toFixed(2)
            ]);
        }
    }
    
    return rows.map(row => row.join(',')).join('\n');
}

// 下载CSV
function downloadCSV(csv, filename) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 初始化提示
console.log('太鼓达人难度计算器已就绪');
console.log('点击"开始计算"按钮开始扫描和计算所有歌曲');