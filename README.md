# 淘金小镇 Skill

中文名叫淘金小镇，英文名叫 **Skillrush Town**。

每天早上，小镇公告板会贴出 ClawHub 下载榜 Top100。这里不只看谁排第一，更关心谁突然冒出来了：新进榜、下载涨得快、星标涨得快、排名往上窜。

这些 Skill 可能还很粗糙，但值得看一眼。淘金就是这样。

## 你可以怎么用

| 你想做什么 | 入口 |
| --- | --- |
| 直接看榜 | 打开 GitHub Pages 页面 |
| 回看某一天 | 用页面顶部日期选择，或访问 `?date=YYYY-MM-DD` |
| 做自己的小镇 | fork 仓库，保留 GitHub Actions |
| 交给 Codex / Claude | 使用 `skills/skillrush-town/SKILL.md` |

## 当前数据

- 第一份快照：`data/snapshots/2026-05-04.json`
- 最新快照：`data/latest.json`
- 日期索引：`data/dates.json`
- 日报归档：`data/reports/2026-05-04.md`

## 页面能力

- 今日 Top10
- 潜力 Skill
- 下载增速 Top10
- 星标增速 Top10
- 新进榜
- 掉榜
- 完整 Top100
- 历史日期回看
- 抓取限制说明

第一次运行没有历史切片，所以不会假装有严格日环比。等连续跑两天后，下载增量、星标增量、排名变化才有意义。

## 安装后怎么用

这个 Skill 本身不会在安装瞬间偷偷创建定时任务。更稳的做法是：安装后第一次使用时，让 Agent 明确帮你完成一次检查，并询问或执行提醒配置。

### 给 Hermes

```text
请使用 skillrush-town，检查今天的 ClawHub Top100，并帮我设置每天上午 10 点提醒。
```

如果你只想手动检查一次：

```text
请使用 skillrush-town，读取 latest.json，总结今天 Top10 和潜力 Skill。
```

### 给 Codex / Claude Code

在 fork 后的项目根目录里说：

```text
请读取 AGENTS.md / CLAUDE.md，并按照 skills/skillrush-town/SKILL.md 验证这个项目。
不要依赖浏览器，先跑 headless validation。
```

### 提醒机制

项目自己的 GitHub Actions 负责每天更新数据；用户提醒属于个人 Agent 侧能力。Hermes 可以用 cron job 每天读取 `data/latest.json` 后发消息；Codex / Claude Code 通常不自带常驻提醒，需要交给 GitHub Actions、系统 cron 或外部 Agent。

## 本地预览

```bash
python -m http.server 8093
```

打开：

```text
http://127.0.0.1:8093/
```

查看某天：

```text
http://127.0.0.1:8093/?date=2026-05-04
```

## 手动更新

```bash
python scripts/clawhub_daily.py --date 2026-05-04
```

脚本会更新：

- `data/snapshots/YYYY-MM-DD.json`
- `data/reports/YYYY-MM-DD.md`
- `data/latest.json`
- `data/dates.json`

## 抓取口径

主榜单固定使用页面运行态真实请求：

```text
POST https://wry-manatee-359.convex.cloud/api/query
path=skills:listPublicPageV4
sort=downloads
dir=desc
nonSuspiciousOnly=true
highlightedOnly=false
numItems=25
```

通过 `nextCursor` 连续翻 4 页，拼出 Top100。

`GET /api/v1/skills` 只做诊断，不作为主榜单接口。它如果返回空 `items`，不代表页面没有榜单。

## 诚实边界

- ClawHub 可能改 Convex path 或字段名。
- 第一次运行没有历史切片，不能写成日环比。
- 如果分页失败，快照和日报必须写明。
- 如果你 fork 后接入别的榜单，要重写 `source-contract.md`。

## 给 Agent 的入口

项目 Skill 在：

```text
skills/skillrush-town/SKILL.md
```

让新 Agent 接手时，可以这样说：

```text
请读取这个仓库，并使用 skills/skillrush-town/SKILL.md。
先检查 README.md、scripts/clawhub_daily.py、data/dates.json、skills/skillrush-town/references/source-contract.md。
请验证 Skillrush Town 是否能抓取 ClawHub Top100、生成历史快照、渲染 GitHub Pages，并指出发布前还缺什么。
```
