# 知序学习库维护约定

此项目是 GitHub Pages 纯静态知识展示网页。知识内容在本地 Codex 整理，用户手动提交与推送到 GitHub。不要自动 commit、push、创建远程仓库或重新部署旧 Sites。

## 用户给出文章链接或文件时

1. 读取原文。可使用 `node scripts/cli.mjs ingest "链接或文件路径"`，用户要求保留配图时添加 `--keep-images`。脚本摄入 TXT、Markdown、HTML；PDF/DOCX 使用当前可用的对应文档工具先提取，不把二进制内容当文本。
2. 阅读 `inbox/<id>/source.txt` 和 `metadata.json`，将 `draft.json` 改写为面向入门级大模型 Agent 开发工程师的知识笔记。CLI 只抓取与提取，不会自动理解文章；总结由本地 Codex 完成，无需额外配置网页 API。
3. 一篇文章对应一个 `content/notes/<id>.json`。默认提供两层阅读内容：summary 用两句概括，points 用于快速回顾；explanations 用于详细学习讲解，每项都有 title 和 body。详细讲解需要覆盖原文主要技术主题和因果关系，说明问题背景、术语含义、工作步骤、改进前后差异、适用场景、代价和常见误解；按实际内容补充贯穿案例、原创代码示例与自测题。不要用每节一两句标签代替讲解，也不要为了篇幅虚构内容。代码可用三反引号。使用自己的教学结构展开，保留必要出处，不照搬或逐段替换措辞重现受版权保护的整篇文章。明确区分原文观点、补充资料和自拟示例。
4. category 只使用：Python 进阶、Agent 开发、大模型基础、RAG 与检索、工程实践。tags 为字符串数组。created/updated 使用 ISO 时间。草稿配图先保存在 `inbox/<id>/assets/`，save 命令只将 images 中保留的图片复制到 `content/assets/`。JSON 路径写成 `assets/<id>/文件名`，不要使用 `/assets/...`。正式笔记只引用存在的 content/assets 资源。
5. 链接文章必须保留 source 原文 URL 和 sourceTitle 原文标题，网页顶部和底部都提供原文入口。对文件文章，若用户或文档提供了原始公开链接，写入 source；无法确定链接时明确保留文件标题，不捏造链接或泄露用户绝对路径。额外核对资料可写入 references 数组（每项 title、url），在网页作为可点击参考资料展示。原文、草稿和摄入元数据留在被忽略的 inbox/，不要将抓取全文直接放到公开网页。
6. 用 `node scripts/cli.mjs save "inbox/<id>/draft.json"` 保存。修改已有文章优先直接编辑原 JSON，保留 id 和 created、更新 updated；草稿覆盖已有笔记需明确加 `--replace`。不要为同一内容重复建页。
7. 运行 `npm run validate`，必要时 `npm run dev` 查看实际页面。告知用户新建/修改了哪些笔记、图片与验证结果，等待用户自己同步 GitHub。

## 技术边界

- `web/` 是只读展示界面，不添加网页写入、API 设置、生成模型调用或云数据库。
- `content/notes/` 是唯一笔记来源。六篇 sample-* 文件是明确标记的入门示例，不是用户导入文章。
- `build.mjs` 编译到 `dist/`，输出不包含 inbox、密钥、源文件路径或旧 Worker。网页内嵌笔记数据，图片使用相对路径，兼容 `https://用户名.github.io/仓库名/`。
- GitHub Pages 工作流在推送 main 后部署，用户负责手动同步；用户未明确授权时不执行远程变更。
- 本机 `E:/Node_js/node.exe` 在复制文件的子进程中曾异常退出；遇到同类问题使用 `C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe` 运行构建与校验。
