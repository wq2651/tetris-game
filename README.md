# 俄罗斯方块 - 双人对战版 🎮

一个精美的网页版俄罗斯方块游戏，支持双人在同一屏幕上对战！

## 游戏截图

## 功能特点

- 🎨精美的现代UI设计，带渐变和光影效果
- 🔊音效支持（移动、旋转、消除、升级、游戏结束）
- 👥双人对战模式
- 📊分数、等级、消除行数统计
- ⏸️暂停/继续功能
- 📱响应式设计，支持移动端

## 操作说明

### 玩家 1
- W - 旋转方块
- A - 左移
- D - 右移
- S - 下移
- 空格键 - 立即下落

### 玩家 2
- ↑ - 旋转方块
- ← - 左移
- → - 右移
- ↓ - 下移
- Enter - 立即下落

## 部署到 GitHub Pages

1. **创建 GitHub 仓库**
   - 登录 GitHub，点击右上角 `+` 号，选择 `New repository`
   - 填写仓库名称（如 `tetris-game`）
   - 选择 `Public`
   - 点击 `Create repository`

2. **上传文件**
   - 在仓库页面点击 `uploading an existing file`
   - 将以下三个文件拖入上传区域：
     - `index.html`
     - `style.css`
     - `game.js`
   - 点击 `Commit changes`

3. **启用 GitHub Pages**
   - 进入仓库的 `Settings` 选项
   - 左侧菜单选择 `Pages`
   - 在 `Source` 部分，选择 `Deploy from a branch`
   - Branch 选择 `main`，文件夹选择 `/ (root)`
   - 点击 `Save`

4. **访问游戏**
   - 等待约1-2分钟，页面会显示你的游戏链接
   - 链接格式：`https://你的用户名.github.io/tetris-game/`

## 本地运行

直接在浏览器中打开 `index.html` 文件即可游玩！

## 技术栈

- HTML5 Canvas
- CSS3（渐变、动画、flexbox）
- 原生 JavaScript
- Web Audio API（音效）

## 许可证

MIT License
