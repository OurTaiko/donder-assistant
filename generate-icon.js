const sharp = require('sharp');
const fs = require('fs');
const pngToIco = require('png-to-ico');

// 创建SVG缓冲区 - 简洁设计：黑边、白色内边距、红色底色
const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- 黑色外圈 -->
  <circle cx="256" cy="256" r="256" fill="#000000"/>
  <!-- 白色内边距 -->
  <circle cx="256" cy="256" r="230" fill="#ffffff"/>
  <!-- 红色底色 -->
  <circle cx="256" cy="256" r="200" fill="#d32f2f"/>
</svg>
`);

async function generateIcons() {
    try {
        console.log('正在生成PNG图标...');
        
        // 生成256x256 PNG
        await sharp(svgBuffer)
            .resize(256, 256)
            .png()
            .toFile('icon-256.png');
        
        console.log('正在转换为ICO格式...');
        
        // 转换为ICO
        const buf = await pngToIco('icon-256.png');
        fs.writeFileSync('icon.ico', buf);
        
        console.log('✓ 图标生成成功！');
        console.log('  - icon.ico (Windows图标)');
        
        // 清理临时文件
        fs.unlinkSync('icon-256.png');
        
    } catch (error) {
        console.error('生成图标失败:', error);
        process.exit(1);
    }
}

generateIcons();