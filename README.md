# 知序 · Agent 学习库

面向入门级大模型 Agent 开发工程师。网页只展示知识、分类和搜索；内容由本地 Codex 整理，完成后由你手动提交与推送到 GitHub，GitHub Pages 构建更新。

## 日常使用：直接交给本地 Codex

在 Codex 中打开本项目，然后发出类似请求：

> 把这个链接加入学习库：https://example.com/article 。整理成入门友好的知识点，保留原文图片。完成后检查并本地预览，先不要提交或推送。

或：

> 把本地文件 D:/资料/Agent入门.md 加入学习库，归到 Agent 开发分类，保留配图。

Codex 会遵循 [AGENTS.md](AGENTS.md) 读取资料、总结并保存。无需给网页配置 API；文章总结使用当前 Codex 会话能力。

## 项目结构

```text
content/notes/       每篇文章一个 JSON，纳入 Git
content/assets/      选择保留的配图，纳入 Git
inbox/               原文、摄入元数据与待整理草稿，不纳入 Git
web/                 静态展示界面
scripts/             内容验证、链接/文件摄入与草稿保存
dist/                构建产物，不纳入 Git
.github/workflows/   GitHub Pages 部署配置
```

目前保留六篇标为「入门示例」的笔记。网页使用相对资源地址，兼容仓库子路径，也可直接打开 `dist/index.html` 阅读（不需要后端）。

## 本地运行

需要 Node.js 22+，无第三方依赖，无需 npm install。

```powershell
npm run validate
npm run dev
```

打开 http://localhost:5173 。更新内容后重新运行构建，刷新页面；预览服务器直接读取最新 dist。

本机系统 Node 曾在复制文件时异常退出。如遇相同情况，可改用应用自带 Node：

```powershell
& 'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' build.mjs
& 'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' check.mjs
& 'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' dev.mjs
```

## 手动摄入与整理

```powershell
# 抓取链接或读取文件；可选同步图片
npm run ingest -- "https://example.com/article" --keep-images
npm run ingest -- "D:/资料/文章.md" --keep-images
```

脚本会生成 `inbox/note-<内容指纹>/source.txt`、`metadata.json` 与 `draft.json`，待选配图暂存于同目录的 `assets/`。它只提取原文，不会伪装成已完成的 AI 总结。让 Codex 阅读原文，完善草稿后保存；只有草稿中引用的图片才移入正式内容目录：

```powershell
npm run note:save -- "inbox/note-内容指纹/draft.json"
# 明确更新已有同 id 笔记时
npm run note:save -- "inbox/note-内容指纹/draft.json" --replace
npm run validate
```

JSON 结构见任一 `content/notes/*.json`：id、title、category、summary、tags、points、images、source、sourceTitle、created、updated。其中 points 每项包含 title 与 body；正文支持纯文本和代码围栏。分类固定为 Python 进阶、Agent 开发、大模型基础、RAG 与检索、工程实践。新增个人笔记不写 `sample: true`。

图片存放于 `content/assets/`，JSON 使用 `assets/文章id/图片.png` 相对路径。CLI 支持 TXT、Markdown、HTML（文件或公开网页）、PNG/JPEG/WebP/GIF，单文件最多 5 MB。Markdown 本地图片须位于文章目录内；复制失败会报告，不静默伪造成功。登录可见、动态渲染或反爬网页可改为提供文件；PDF/DOCX 由本地 Codex 用对应文档工具提取后整理。

## 首次发布到 GitHub Pages

1. 在 GitHub 创建仓库，把本项目目录作为仓库根目录。项目尚未绑定 GitHub 地址。
2. 在本目录手动绑定远程并提交（将占位地址换成真实仓库）：

```powershell
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git add .
git commit -m "Migrate learning library to GitHub Pages"
git push -u origin main
```

3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 首次可在 **Actions → Deploy learning library to GitHub Pages → Run workflow** 手动运行。之后每次手动推送 main 都会构建与部署。
5. 发布地址以该次 Actions 的 github-pages environment 返回 URL 为准，通常为 `https://用户名.github.io/仓库名/`。

配置依据：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。若使用其他默认分支，同步修改 `.github/workflows/pages.yml` 中两处 main。

本项目所在 G 盘不记录文件所有权。如本机 Git 提示 `detected dubious ownership`，可以由你执行以下命令，只为这个项目添加信任，再重试上述命令：

```powershell
git config --global --add safe.directory 'G:/0000000000个人资料/learning/agent-learning-library'
```

## 后续手动同步

```powershell
npm run validate
git diff
git add content web scripts build.mjs dev.mjs check.mjs package.json README.md AGENTS.md .github .gitignore
git commit -m "Update learning notes"
git push origin main
```

只更新知识时可只暂存 `content/`。Codex 默认不执行 commit、push 或远程仓库操作。

## 迁移说明

已经移除 Worker、API 配置、云存储依赖及网页编辑入口。本次只修改本地项目，不会更新或关闭之前的 Sites 站点，也不会自动抓取旧站点的云端个人笔记。旧站点如有后来添加的个人笔记，需要另行导出并转换到 `content/notes/`；旧 `/api/images/` 图片也须下载成本地资源。

GitHub Pages 静态站点不沿用旧站点的仅本人访问权限；发布前按你实际的 GitHub 方案与仓库设置确认站点访问范围。原文与草稿默认不发布，正式笔记与所选图片会进入构建产物。
