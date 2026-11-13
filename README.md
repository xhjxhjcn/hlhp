# hlhp

Hexo + [Fluid](https://github.com/fluid-dev/hexo-theme-fluid) 主题的站点骨架，**目前是完全未改动的官方样板**，等以后确定了再往里填内容。

## 现在是什么状态

- 站点配置 `_config.yml` 全部保留 Hexo 官方默认值（`title: Hexo`、`author: John Doe`、`url: http://example.com`）。
- 主题配置 `_config.fluid.yml` 是 Fluid 官方 `_config.yml` 的完整拷贝，一个值都没动。改主题就改这个文件，**不要去动 `node_modules` 里的主题**。
- 唯一的内容是一篇 Hexo 自带的 `Hello World` 示例文章。

## 本地跑起来

需要 Node.js >= 18。

```bash
npm install
npm run dev          # http://localhost:4000
```

## 构建

```bash
npm run build        # 产物在 public/
npm run clean        # 清掉 public/ 和缓存
```

## 部署到 EdgeOne

控制台 → 导入 Git 仓库 → 选本仓库即可。**构建参数全部写在仓库根目录的 `edgeone.json` 里**，不用在控制台手填：

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "./public",
  "nodeVersion": "22.11.0"
}
```

### 踩过的坑（重要，别再踩一次）

第一次部署失败，根因是之前仓库里放了个 `.nvmrc` 写着 `20.19.0`：

- EdgeOne **只预装**这几个 Node 版本：`14.21.3`、`16.20.2`、`18.20.4`、`20.18.0`、`22.11.0`、`22.17.1`、`22.21.1`、`24.5.0`、`24.11.0`、`24.18.0`。
- 仓库根目录有 `.nvmrc` 时，构建机会走 nvm 去**临时下载**指定版本；官方文档明确写了这一步会「排除对应的包管理器」。
- 我写的 `20.19.0` 不在预装列表里 → 触发下载 → 安装环节崩掉。

现在三处一起改掉了，互相兜底：

1. 删掉了 `.nvmrc`，改由 `edgeone.json` 的 `nodeVersion` 显式指定预装版本 `22.11.0`；
2. `hexo` 从 `^8.0.0` 降到 `^7.3.0`（Hexo 8 要求 Node >= 20.19.0，Hexo 7 只要 >= 14）。这样即使控制台把 Node 版本改回 18 或 20.18，也照样能构建；
3. 显式写了 `installCommand`，不依赖平台自动探测包管理器。

## 以后要改的地方（TODO）

1. **`_config.yml`** —— 站点标题、副标题、作者、语言（`language: zh-CN`）、`url`（改成最终域名，否则 canonical 和 RSS 里是 `example.com`）、`timezone: Asia/Shanghai`。
2. **`_config.fluid.yml`** —— 导航栏标题 `navbar.blog_title`、菜单项、首页大图（`index.banner_img`）、头像、配色、页脚备案号。
3. **`source/_posts/`** —— 删掉示例文章，换成真内容。新建文章用 `npx hexo new "标题"`。
4. **`source/about/index.md`** —— 导航栏有 About，需要自己建这个页面：`npx hexo new page about`。

## 目录说明

```
edgeone.json           EdgeOne 构建配置（构建命令 / 输出目录 / Node 版本）
_config.yml            站点配置（Hexo）
_config.fluid.yml      主题配置（Fluid，覆盖 node_modules 里的默认值）
package.json           依赖与脚本
scaffolds/             新建文章/页面的模板
source/_posts/         文章
source/                静态资源（图片等）
```

## 许可

主题 Fluid 使用 GPL-3.0，原样保留在 `LICENSE-fluid.txt`。
