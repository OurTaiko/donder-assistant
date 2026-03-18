const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

// 获取data文件夹路径
// 开发环境：项目根目录下的data文件夹
// 打包后：exe文件所在目录的data文件夹
function getDataPath() {
    if (app.isPackaged) {
        // 打包后，使用exe文件所在目录
        return path.join(path.dirname(app.getPath('exe')), 'data');
    } else {
        // 开发环境，使用项目根目录
        return path.join(__dirname, 'data');
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'icon.ico')
    });

    // 移除默认菜单
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('renderer/index.html');
    
    // 开发模式下打开开发者工具
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC处理：扫描data文件夹
ipcMain.handle('scan-data-folder', async () => {
    try {
        const dataPath = getDataPath();
        const categories = await fs.readdir(dataPath);
        
        const results = [];
        
        for (const category of categories) {
            // 跳过__MACOSX等系统文件夹
            if (category.startsWith('.') || category.startsWith('__')) {
                continue;
            }
            
            const categoryPath = path.join(dataPath, category);
            const stat = await fs.stat(categoryPath);
            
            if (!stat.isDirectory()) {
                continue;
            }
            
            // 扫描分类下的歌曲
            const songs = await fs.readdir(categoryPath);
            
            for (const song of songs) {
                const songPath = path.join(categoryPath, song);
                const songStat = await fs.stat(songPath);
                
                if (!songStat.isDirectory()) {
                    continue;
                }
                
                // 查找JSON文件
                const files = await fs.readdir(songPath);
                const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('Sou-uchi'));
                
                if (jsonFiles.length > 0) {
                    const jsonPath = path.join(songPath, jsonFiles[0]);
                    
                    results.push({
                        category,
                        songName: song,
                        jsonPath
                    });
                }
            }
        }
        
        return results;
    } catch (error) {
        console.error('扫描失败:', error);
        throw error;
    }
});

// IPC处理：读取JSON文件
ipcMain.handle('read-song-data', async (event, jsonPath) => {
    try {
        const data = await fs.readFile(jsonPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取失败:', error);
        throw error;
    }
});

// IPC处理：批量读取所有歌曲数据
ipcMain.handle('load-all-songs', async (event, songList) => {
    try {
        const results = [];
        
        for (const song of songList) {
            try {
                const data = await fs.readFile(song.jsonPath, 'utf-8');
                const jsonData = JSON.parse(data);
                
                results.push({
                    ...song,
                    data: jsonData
                });
            } catch (error) {
                console.error(`读取 ${song.songName} 失败:`, error.message);
            }
        }
        
        return results;
    } catch (error) {
        console.error('批量读取失败:', error);
        throw error;
    }
});