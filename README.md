# hlhp

一个**纯静态**的个人博客：主页、随影、拾记、关于。

没有后端、没有数据库、没有登录注册、没有留言或评论——所有页面在构建时生成成普通 HTML，扔到任何静态托管上就能跑。

设计语言参考了「纸张 + 墨色」的编辑排版：米白纸面、鼠尾草绿、手写体标题、便签与胶带、和纸质感的分隔线。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 主页：公告便签、更新日历、统计、头条轮播、拍立得、新近文章、旅途条带 |
| `/moments.html` | 随影：瀑布流照片墙 + 点开看大图（键盘 ←/→/Esc、触摸滑动） |
| `/journal.html` | 拾记：文章卡片 + 絮语便签，可切换列表/卡片模式 |
| `/journal/<slug>.html` | 文章详情：封面、摘要、目录、正文 |
| `/about.html` | 关于：自述、作者介绍、版权声明、站点更新日志弹窗 |

额外生成：`404.html`、`robots.txt`、`feed.xml`。

**已移除**：登录 / 注册、留言板、评论、点赞上报、友链申请、仓库页、随行地图、3D 模型、足迹统计等一切依赖后台的功能。点赞、浏览量这些数字只作为静态文案展示。

## 本地开发

需要 Node.js >= 18（构建脚本没有任何第三方依赖）。

```bash
npm run build     # 生成 dist/
npm run dev       # 预览 dist/，默认 http://127.0.0.1:4173
npm run clean     # 清掉 dist/
```

## 改内容

内容全部在 `src/data/`，改完重新 `npm run build` 即可：

| 文件 | 管什么 |
| --- | --- |
| `src/data/site.json` | 站点标题、导航、公告、统计、头条轮播、旅途条带、页脚 |
| `src/data/photos.json` | 随影：每张照片的标题、日期、地点、相机参数、比例、描述 |
| `src/data/journal.json` | 拾记：文章（正文是分块数组）和絮语 |
| `src/data/about.json` | 关于页：自述、作者介绍、版权、更新日志 |

### 加一篇拾记

在 `src/data/journal.json` 的 `posts` 里追加一项：

```json
{
  "id": "my-post",
  "slug": "my-post",
  "title": "标题",
  "date": "2026-11-20",
  "dateText": "2026年11月20日",
  "kind": "article",
  "cover": "/assets/img/covers/cover-01.webp",
  "summary": "列表页显示的摘要",
  "tags": ["标签"],
  "words": 1200,
  "views": 0,
  "likes": 0,
  "sections": [{ "id": "part-1", "title": "小标题" }],
  "body": [
    { "type": "p", "text": "正文段落。" },
    { "type": "h2", "id": "part-1", "text": "小标题" },
    { "type": "figure", "src": "/assets/img/misc/hero.webp", "caption": "图注" },
    { "type": "quote", "text": "引用。" }
  ]
}
```

`sections` 里的 `id` 要和正文里的 `h2` 的 `id` 对上，右侧目录和滚动高亮才准。

### 加一张随影

把图片放进 `src/assets/img/photos/`，然后在 `src/data/photos.json` 里追加一项，`ratio` 写图片的宽高比（如 `"4 / 5"`、`"3 / 4"`、`"16 / 9"`），构建时会按图片比例自动做瀑布流分栏。

## 图片与资源

- 配图是脚本生成的抽象占位图（`src/assets/img/`），换成自己的照片直接覆盖即可。
- `src/assets/img/brand-logo.svg` 是站点标志，`favicon.svg` 是浏览器图标。
- 手写体是 `src/assets/fonts/SmileySans-Oblique.woff2`（得意黑，SIL OFL 1.1）。
- 正文用的是系统字体栈（宋体 / PingFang / 微软雅黑），没有额外字体依赖。

## 部署到 EdgeOne

构建参数写在仓库根的 `edgeone.json` 里，控制台不用手填：

```json
{
  "installCommand": "npm install --no-audit --no-fund",
  "buildCommand": "npm run build",
  "outputDirectory": "./dist",
  "nodeVersion": "22.11.0"
}
```

> Node 版本必须选 EdgeOne **预装**的那几个（`14.21.3`、`16.20.2`、`18.20.4`、`20.18.0`、`22.11.0`、`22.17.1`、`22.21.1`、`24.5.0`、`24.11.0`、`24.18.0`）。别放 `.nvmrc`，写了会触发构建机临时下载你指定的版本，容易直接崩在安装环节。

因为是纯静态产物，`dist/` 里没有服务端逻辑，部署到 GitHub Pages、Vercel、Netlify、Cloudflare Pages 也都能直接用。

## 目录

```
edgeone.json            EdgeOne 构建配置
package.json            脚本（无运行时依赖）
tools/build.mjs         构建：JSON + 资源 → dist/
tools/serve.mjs         本地预览服务器
src/data/               内容源（改这里）
src/assets/css/site.css 全部样式
src/assets/js/          交互脚本（原生 JS，无框架）
src/assets/img/         图片资源
src/assets/fonts/       字体
dist/                   构建产物（已 gitignore）
```

## 许可

站内文字与图片的版权声明见 `/about.html`。字体各自遵循其原始许可。
