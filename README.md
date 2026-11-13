# hlhp

Hexo + [Fluid](https://github.com/fluid-dev/hexo-theme-fluid) 主题的站点骨架，**目前是完全未改动的官方样板**，等以后确定了再往里填内容。

## 现在是什么状态

- 站点配置 `_config.yml` 全部保留 Hexo 官方默认值（`title: Hexo`、`author: John Doe`、`url: http://example.com`）。
- 主题配置 `_config.fluid.yml` 是 Fluid 官方 `_config.yml` 的完整拷贝，一个值都没动。改主题就改这个文件，**不要去动 `node_modules` 里的主题**。
- 唯一的内容是一篇 Hexo 自带的 `Hello World` 示例文章。

## 本地跑起来

需要 Node.js >= 20.19.0（Hexo 8 的要求）。

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

EdgeOne Makers（原 EdgeOne Pages）控制台 → 导入 Git 仓库 → 选本仓库，然后：

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `hexo generate`（也可以用 `npm run build`，等价） |
| 输出目录 | `public` |

Hexo 在 EdgeOne 的「Other Frameworks」文档里有官方预设，就是上面这两个值，不需要 `edgeone.json`。
构建完成后产物是纯静态文件，CDN 和 HTTPS 由 EdgeOne 自动处理。

> 唯一要留意的：Hexo 8 要求 Node >= 20.19.0。EdgeOne 构建机的 Node 版本我没法从文档确认，
> 仓库里的 `.nvmrc` 只是给本地和 CI 参考。万一构建日志报 Node 版本不够，两个办法：
> 在 EdgeOne 环境变量里指定 Node 版本，或者把 `package.json` 里的 `"hexo": "^8.0.0"` 降到 `"^7.3.0"`
> （Hexo 7 只要 Node >= 14，站点配置和 Fluid 主题都兼容，本机实测两版都能出站）。

## 以后要改的地方（TODO）

1. **`_config.yml`** —— 站点标题、副标题、作者、语言（`language: zh-CN`）、`url`（改成最终域名，否则 canonical 和 RSS 里是 `example.com`）、`timezone: Asia/Shanghai`。
2. **`_config.fluid.yml`** —— 导航栏标题 `navbar.blog_title`、菜单项、首页大图（`index.banner_img`）、头像、配色、页脚备案号。
3. **`source/_posts/`** —— 删掉示例文章，换成真内容。新建文章用 `npx hexo new "标题"`。
4. **`source/about/index.md`** —— 导航栏有 About，需要自己建这个页面：`npx hexo new page about`。

## 目录说明

```
_config.yml            站点配置（Hexo）
_config.fluid.yml      主题配置（Fluid，覆盖 node_modules 里的默认值）
package.json           依赖与脚本
scaffolds/             新建文章/页面的模板
source/_posts/         文章
source/                静态资源（图片等）
.nvmrc                 Node 版本
```

## 许可

主题 Fluid 使用 GPL-3.0，原样保留在 `LICENSE-fluid.txt`。
