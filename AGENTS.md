# 知序学习库维护约定

此项目是 GitHub Pages 纯静态知识展示网页。知识内容在本地 Codex 整理，用户手动提交与推送到 GitHub。不要自动 commit、push、创建远程仓库或重新部署旧 Sites。

## 用户给出文章链接或文件时

1. 读取原文。可使用 `node scripts/cli.mjs ingest "链接或文件路径"`，用户要求保留配图时添加 `--keep-images`。脚本摄入 TXT、Markdown、HTML；PDF/DOCX 使用当前可用的对应文档工具先提取，不把二进制内容当文本。
2. 阅读 `inbox/<id>/source.txt` 和 `metadata.json`，将 `draft.json` 改写为面向入门级大模型 Agent 开发工程师的知识笔记。CLI 只抓取与提取，不会自动理解文章；总结由本地 Codex 完成，无需额外配置网页 API。
3. 一篇文章对应一个 `content/notes/<id>.json`。标题简明，summary 用两句概括；points 每项有短标题和通俗解释，按文章实际内容补充用途、例子、易错点。代码示例可用三反引号。忠于原文，明确区分原文内容与额外解释，不编造来源。
4. category 只使用：Python 进阶、Agent 开发、大模型基础、RAG 与检索、工程实践。tags 为字符串数组。created/updated 使用 ISO 时间。草稿配图先保存在 `inbox/<id>/assets/`，save 命令只将 images 中保留的图片复制到 `content/assets/`。JSON 路径写成 `assets/<id>/文件名`，不要使用 `/assets/...`。正式笔记只引用存在的 content/assets 资源。
5. 保留来源 URL 与原文标题；本地文件只写标题，不把用户绝对路径写入发布内容。原文、草稿和摄入元数据留在被忽略的 `inbox/`。网站只发布选定的笔记和配图。
6. 用 `node scripts/cli.mjs save "inbox/<id>/draft.json"` 保存。修改已有文章优先直接编辑原 JSON，保留 id 和 created、更新 updated；草稿覆盖已有笔记需明确加 `--replace`。不要为同一内容重复建页。
7. 运行 `npm run validate`，必要时 `npm run dev` 查看实际页面。告知用户新建/修改了哪些笔记、图片与验证结果，等待用户自己同步 GitHub。

## 技术边界

- `web/` 是只读展示界面，不添加网页写入、API 设置、生成模型调用或云数据库。
- `content/notes/` 是唯一笔记来源。六篇 sample-* 文件是明确标记的入门示例，不是用户导入文章。
- `build.mjs` 编译到 `dist/`，输出不包含 inbox、密钥、源文件路径或旧 Worker。网页内嵌笔记数据，图片使用相对路径，兼容 `https://用户名.github.io/仓库名/`。
- GitHub Pages 工作流在推送 main 后部署，用户负责手动同步；用户未明确授权时不执行远程变更。
- 本机 `E:/Node_js/node.exe` 在复制文件的子进程中曾异常退出；遇到同类问题使用 `C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe` 运行构建与校验。
