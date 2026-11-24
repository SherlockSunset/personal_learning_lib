# 知序 · Agent 学习库

面向入门级大模型 Agent 开发工程师。网页只展示知识、分类和搜索；内容由本地 Codex 整理，完成后由你手动提交与推送到 GitHub，GitHub Pages 构建更新。

默认文章同时提供「知识提要」和「详细讲解」两层内容，优先打开详细讲解。后者覆盖主要技术主题，展开原理、步骤、贯穿案例、使用边界与自测；默认下载正文配图并插在对应章节的相关段落，附中文图注和原文来源，支持点击看大图。原文通过页面顶部与底部的链接阅读。文件若没有可核实的原文链接，则显示来源标题，不编造 URL。

## 日常使用：直接交给本地 Codex

在 Codex 中打开本项目，然后发出类似请求：

> 把这个链接加入学习库：https://example.com/article 。整理成入门友好的知识点，保留原文图片。完成后检查并本地预览，先不要提交或推送。

或：

> 把本地文件 D:/资料/Agent入门.md 加入学习库，归到 Agent 开发分类，保留配图。

Codex 会遵循 [AGENTS.md](AGENTS.md) 读取资料、总结并保存。无需给网页配置 API；文章总结使用当前 Codex 会话能力。

## 项目结构

```text
content/notes/       每篇文章一个 JSON，纳入 Git
content/quizzes/     每篇文章的配套自测题库，纳入 Git
content/assets/      选择保留的配图，纳入 Git
inbox/               原文、摄入元数据与待整理草稿，不纳入 Git
web/                 静态展示界面
scripts/             内容验证、链接/文件摄入与草稿保存
dist/                构建产物，不纳入 Git
.github/workflows/   GitHub Pages 部署配置
```

目前保留六篇标为「入门示例」的笔记。网页使用相对资源地址，兼容仓库子路径，也可直接打开 `dist/index.html` 阅读（不需要后端）。

## 阅读后自测

当前 Agent 文章提供“掌握自测”页，包含 6 道判断、7 道单选和 3 道简答，覆盖 13 个核心知识点。可以直接打开 `http://localhost:5173/#note/note-0f561bcbef/quiz`，或从文章阅读标签进入。

- 作答前隐藏答案，可标记“不确定”；草稿随输入自动保存在当前浏览器，刷新后可继续。
- 提交后客观题自动判分；简答题展示参考答案和评分要点，由你逐项核对并确认自评。待自评时不显示最终总分，各题按完成度等权计入百分制。
- 解析提供回读链接，跳到明确章节，再返回自测可继续查看成绩。
- “只练薄弱项”选择当前题库最近一次证据中的错题、简答未全得分题及不确定题。重练后按每题最新结果合并掌握状态。
- 覆盖表区分题库是否覆盖与自己是否掌握；全部关联题都有正确、确定的作答证据才标记“本次掌握”。没有完成全部关联题时显示证据不足。
- 每篇最近 30 次历史保存在 localStorage，包含题目和答案快照；题库变化时旧成绩标为历史快照，不参与新版判断。全量与薄弱重练的题量会分别标注。
- 学习记录只在当前设备、浏览器和站点地址下保存，切换域名或端口不共享。禁用、损坏或空间不足会提示临时保存。当前不提供跨设备同步和 AI 自动简答评分。

新文章的题库格式与生成要求见 [AGENTS.md](AGENTS.md)。为文章设置 assessmentRequired 后，构建会检查题库存在、三种题型、答案结构、知识点全覆盖和回读目标。更新题目应递增题库 version，内容指纹也会避免误用旧记录。网页的自测用于自我评估，题库答案随静态内容发布。

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
# 抓取链接或读取文件，默认同步图片
npm run ingest -- "https://example.com/article"
npm run ingest -- "D:/资料/文章.md"
# 明确不保留配图时
npm run ingest -- "https://example.com/article" --no-images
```

脚本会生成 `inbox/note-<内容指纹>/source.txt`、`metadata.json` 与 `draft.json`，待选配图暂存于同目录的 `assets/`。HTML 正文保留图片位置标记，metadata.json 提供图号、图注、小标题和本地路径；Codex 据此判断插入位置，剔除广告与装饰图片。脚本只提取原文，不会伪装成已完成的 AI 总结。让 Codex 阅读原文，完善草稿后保存；只有草稿中引用的图片才移入正式内容目录：

```powershell
npm run note:save -- "inbox/note-内容指纹/draft.json"
# 明确更新已有同 id 笔记时
npm run note:save -- "inbox/note-内容指纹/draft.json" --replace
npm run validate
```

JSON 结构见 `content/notes/note-0f561bcbef.json`：id、title、category、summary、tags、points、explanations、references、images、source、sourceTitle、created、updated。points（知识提要）和 explanations（详细讲解）每项包含 title 与 body；正文支持纯文本和代码围栏。references 每项为 title 与 url，用于可点击的延伸资料。旧笔记没有 explanations 时继续直接显示 points。分类固定为 Python 进阶、Agent 开发、大模型基础、RAG 与检索、工程实践。新增个人笔记不写 `sample: true`。

图片存放于 `content/assets/`，JSON 使用 `assets/文章id/图片.png` 相对路径。CLI 支持 TXT、Markdown、HTML（文件或公开网页）、PNG/JPEG/WebP/GIF，单文件最多 5 MB。Markdown 本地图片须位于文章目录内；复制失败会报告，不静默伪造成功。登录可见、动态渲染或反爬网页可改为提供文件；PDF/DOCX 由本地 Codex 用对应文档工具提取后整理。

每节可通过 illustrations 指定原图与插入位置，例如：

```json
{
  "title": "理解缓存",
  "body": "第一段解释。\n\n第二段解释。",
  "illustrations": [{
    "src": "assets/note-example/cache.png",
    "alt": "稳定前缀与变化内容的对比图",
    "caption": "原文配图｜前缀保持不变有利于缓存复用。",
    "source": "https://example.com/article",
    "afterParagraph": 1
  }]
}
```

afterParagraph 从 1 开始，表示插在第几个文字段落后；空行分隔段落，代码块不计数。省略时放在该节末尾。默认最多抓取 24 张图片，超出或失败会提示。图片可仅通过 illustrations 引用，保存与构建会自动收集，不必重复添加到 images 图库。

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

项目只保留 `.github/workflows/pages.yml` 作为活动部署工作流；GitHub 自动建议的 Jekyll 模板不适用于本项目，已归档到 `.github/legacy/`。首次同步这个调整时，请将 `.github/` 的新增、修改及旧工作流删除一起提交（例如 `git add -A .github README.md`）。

```powershell
npm run validate
git diff
git add content web scripts build.mjs dev.mjs check.mjs package.json README.md AGENTS.md .github .gitignore
git commit -m "Update learning notes"
git push origin main
```

只更新知识时可只暂存 `content/`。Codex 默认不执行 commit、push 或远程仓库操作。

## 部署排错

- `configure-pages` 返回 Not Found：在仓库 Settings → Pages 将 Source 设为 GitHub Actions，然后启动完整工作流。
- `deploy-pages` 提示找不到 `github-pages` artifact：查看同一运行的 build job。它必须依次成功构建 dist/index.html、上传名为 github-pages 的产物并得到 artifact ID，deploy 才会执行。上传与部署必须属于同一 workflow run；其他运行的同名文件不能替代。
- 当前产物保留 7 天。若产物过期、被删除或上传步骤未完成，应启动新的完整运行，让构建与上传重新执行；仅重跑 deploy 不会补回缺失的产物。
- 同步工作流修复后，在 Actions 中选择 **Deploy learning library to GitHub Pages → Run workflow → main**，使用当前代码启动新运行。不要将旧工作流的重跑当作新配置的验证。
- `punycode` DeprecationWarning 是依赖警告；定位失败时优先查看实际 Error 和上传产物步骤。

相关官方说明：[Pages 产物上传动作](https://github.com/actions/upload-pages-artifact/tree/v3)、[Pages 部署动作](https://github.com/actions/deploy-pages/tree/v4)。`upload-pages-artifact@v3` 内部使用兼容的 upload-artifact@v4，不需要因为 deploy-pages@v4 的版本号将其改成不存在或未经验证的版本。

## 迁移说明

已经移除 Worker、API 配置、云存储依赖及网页编辑入口。本次只修改本地项目，不会更新或关闭之前的 Sites 站点，也不会自动抓取旧站点的云端个人笔记。旧站点如有后来添加的个人笔记，需要另行导出并转换到 `content/notes/`；旧 `/api/images/` 图片也须下载成本地资源。

GitHub Pages 静态站点不沿用旧站点的仅本人访问权限；发布前按你实际的 GitHub 方案与仓库设置确认站点访问范围。原文与草稿默认不发布，正式笔记与所选图片会进入构建产物。
