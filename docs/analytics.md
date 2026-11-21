# 统计 · GA4 + Search Console

Web 版的任务是看流量、做 SEO、量转化。代码在 `analytics.js`，只在 `hands-on.withzurara.com` 且填了 ID 时才加载 Google 的脚本；本地开发把事件打印在控制台（`[track] …`）。

## 漏斗

| 步骤 | 事件 | 参数 |
|---|---|---|
| 1 进站 | `page_view` `/` | |
| 2 点开今日一件 | `page_view` `/today` | |
| 3 真的动手（第一次走对一步） | `daily_start` | `craft` `input`(keys/touch) `day` |
| 4 做完 | `daily_complete` | `craft` `day` `rows` `streak` |
| 5 分享 | `share`（分享做好后加） | |
| 6 别人从分享链接进来 | `page_view` 带 `utm_source=share`（同上） | |

自由玩：`page_view` `/embroidery` `/knitting`，动手记 `craft_start`。每次进门「开始动手」只记一次。

在 GA4 里：**探索 → 漏斗探索**，步骤按上表 2→3→4 建；`craft`、`input`、`day` 要先在 **管理 → 自定义定义** 里注册成事件范围的自定义维度，报表里才看得到。`daily_complete` 可以标成**关键事件**（旧称转化）。

## 隐私

不弹同意框。欧洲经济区、英国、瑞士默认 `analytics_storage: denied`（Consent Mode：不写 cookie，只发匿名信号，GA4 用模型补数），其他地区正常统计；广告相关四项全部 denied。中国大陆加载不到 Google，大陆访客基本统计不到。

## 你要做的（只有你能做）

1. **GA4**：analytics.google.com → 建一个媒体资源「有手就行」→ 网站数据流，网址 `https://hands-on.withzurara.com` → 复制**衡量 ID**（`G-` 开头）给我，填进 `analytics.js` 的 `ID`。
2. **Search Console**：等换到新域名后再做。search.google.com/search-console → 添加资源，选**网域**，填新域名（一次涵盖所有子网域）→ 它给一条 TXT 记录 → 到域名商的 DNS 加上 → 回去点验证。

## 还没做

- **SEO 路径**：现在是 `#/embroidery` 这种，Google 当成同一页。要被分别搜到，得改成真路径 `/embroidery/` `/knitting/` `/today/`，每页有自己的标题、描述、分享图和一段文字，再加 `sitemap.xml` 和 `robots.txt`。
