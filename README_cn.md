<div align="center">

# ⚡ Awesome Claude Agent Skills

### _AI 原生开发的自主技能工厂_

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=58A6FF&center=true&vCenter=true&width=600&lines=自进化+MCP+技能;AI+维护的注册表;Skill-Link+架构" alt="Typing SVG" />

---

**[English](./README.md)** | **中文**

<img src="https://img.shields.io/badge/AIwork4me-Brand-FF6B35?style=for-the-badge&logo=robot&logoColor=white" />
<img src="https://img.shields.io/badge/MCP-2026_Protocol-4A90D9?style=for-the-badge&logo=protocol&logoColor=white" />
<img src="https://img.shields.io/badge/Architecture-Autonomous-22C55E?style=for-the-badge&logo=autonomous&logoColor=white" />
<img src="https://img.shields.io/badge/Standard-Deep_Agent-8B5CF6?style=for-the-badge&logo=shield&logoColor=white" />

</div>

---

## 🧠 关于

**Awesome-Claude-Agent-Skills** 是一个 **自进化生态系统**，包含符合 MCP 标准的技能，专为 Claude Code 和 AI Agent 设计。每个技能都遵循 **AIwork4me** 理念：*让 AI 替我干活*。

> ⚡ **核心创新**：技能可以通过 **Skill-Link** 链式组合 —— 直接将输出传递给下一个技能。

### 🛡️ 2026 Deep Agent 标准

工厂生成的所有技能默认具备 **自愈能力**、**进度感知** 和 **安全优先** 特性：

| 特性 | 说明 |
|---------|-------------|
| 🔄 **自愈能力** | 自动异常检测、指数退避重试、降级策略 |
| 📊 **进度感知** | 实时进度报告 (0-100%)、中间结果、心跳信号 |
| 🔒 **安全优先** | 输入消毒、SSRF 防护、提示词注入防护、路径遍历阻断 |

---

## 🌐 AIwork4me 生态系统

本仓库是 **AIwork4me** 自主开发矩阵的一部分：

```
┌─────────────────────────────────────────────────────────────────┐
│                     AIwork4me 生态系统                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │  Awesome-Claude-    │    │    MCP Servers      │           │
│  │  Agent-Skills       │───▶│    (本仓库)          │           │
│  │  (技能工厂)          │    │                     │           │
│  └─────────────────────┘    └─────────────────────┘           │
│           │                          │                          │
│           ▼                          ▼                          │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │   OpenClaw Deep     │    │   Dify / LangChain  │           │
│  │   Research 引擎     │    │   编排平台           │           │
│  └─────────────────────┘    └─────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Claude Code Agent                  │           │
│  │         (自主技能执行)                           │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 技能注册表

<!-- SKILL_REGISTRY_START -->
| 技能 | 类别 | 功能 | MCP 命令 | Deep Agent | 状态 |
|-------|----------|------------|-------------|------------|--------|
| [openclaw-deep-research](./skills/web/openclaw-deep-research) | Web | OpenClaw 多步搜索与抓取 | `mcp__openclaw__deep_research` | ✅ 完整 | ✅ 生产 |
| [infra-integrity-checker](./skills/automation/infra-integrity-checker) | 自动化 | 系统化自测技能 | `mcp__infra_integrity_checker__main` | ✅ 完整 | 🔵 内测 |
<!-- SKILL_REGISTRY_END -->

> *注册表由 `skill-factory.ts` 自动更新*

---

## 🏗️ 架构

```
Awesome-Claude-Agent-Skills/
├── 📁 skills/                 # 模块化技能仓库
│   ├── web/                   # Web 交互技能
│   ├── code/                  # 代码生成与分析
│   ├── data/                  # 数据处理技能
│   └── automation/            # 工作流自动化
├── 📁 templates/
│   └── mcp-ts-starter/        # 黄金标准 MCP 服务模板
├── 📁 registry/
│   └── discovery.json         # 集中式技能元数据
├── 📁 scripts/
│   └── skill-factory.ts       # 自主技能脚手架 (v2.2)
├── 📁 docs/ai-workflow/       # AI Agent 文档
├── 📁 .claude/
│   └── AGENT_HANDBOOK.md      # Claude 实例内部记忆
└── 📄 README.md               # 本文件
```

---

## 🚀 快速开始

### 人类用户 (配合 Claude Code)

```bash
# 1. 克隆仓库
git clone https://github.com/AIwork4me/Awesome-Claude-Agent-Skills.git

# 2. 创建新技能 (< 60 秒)
bun run scripts/skill-factory.ts create --category=web --name=my-awesome-skill

# 3. 运行安全审计 (2026 标准)
bun run scripts/skill-factory.ts audit --skill=my-awesome-skill

# 4. 完成！Claude Code 会处理其余工作。
```

### AI Agent

阅读 `.claude/AGENT_HANDBOOK.md` 获取完整指令：
- **发现**：扫描外部源获取新的 MCP 想法
- **接入**：使用 `skill-factory.ts` 添加新技能
- **精炼**：将原始工具包装成 AIwork4me 高级标准

---

## 🤖 AI 优先贡献指南

本仓库专为 **人机配对编程** 设计。以下是如何在 60 秒内添加新技能：

### 第 1 步：描述你的技能 (5秒)

打开 Claude Code 并说：
> "添加一个名为 `github-issue-bot` 的技能，类别为 `automation`，功能是从自然语言创建 GitHub Issues"

### 第 2 步：Claude 完成所有工作 (55秒)

Claude Code 将：
1. ✅ 运行 `skill-factory.ts create` 脚手架
2. ✅ 生成符合 Deep Agent 标准的 MCP 服务代码
3. ✅ 创建 `progress.ts` 进度报告模块
4. ✅ 创建 `resilience.ts` 自愈逻辑
5. ✅ 创建 `security.test.ts` 安全审计测试
6. ✅ 更新 `discovery.json` 注册表
7. ✅ 更新 README 技能注册表

### 第 3 步：审查并提交

```bash
git add . && git commit -m "feat: add github-issue-bot skill"
```

---

## 🔗 Skill-Link 架构

技能可以链式组合形成复杂工作流，支持 **2026 增强型流水线**：

```typescript
import { SkillLink } from "@aiwork4me/skill-link";

// 2026 增强型流水线 + 自动恢复
const pipeline = [
  {
    skill: "openclaw-deep-research",
    input: { query: "MCP 2026 最佳实践" }
  },
  {
    skill: "ai-summarizer",
    options: { detail: "high", maxLength: 2000 }
  },
  {
    skill: "github-issue-bot",
    options: { labels: ["research", "automation"] }
  }
];

// 执行并启用 Deep Agent 特性
const result = await SkillLink.execute(pipeline, {
  // 自动恢复：失败时自动重试
  autoRecover: true,
  maxRetries: 3,

  // 进度报告：实时反馈
  onProgress: (p) => {
    console.log(`[${p.step}/${p.total}] ${p.skill}: ${p.message}`);
  },

  // 诊断：追踪流水线健康状态
  onDiagnostic: (d) => {
    if (d.warnings.length > 0) {
      console.warn(`警告: ${d.warnings.join(", ")}`);
    }
  }
});

// 访问自愈元数据
console.log(result.diagnostics);
// {
//   warnings: [],
//   recoveryAttempts: 0,
//   finalState: 'success',
//   totalDuration: 15234
// }
```

---

## 📚 文档

| 文档 | 用途 |
|----------|---------|
| [AGENT_HANDBOOK.md](./.claude/AGENT_HANDBOOK.md) | Claude 实例内部记忆 |
| [AI 工作流指南](./docs/ai-workflow/) | AI Agent 如何扩展本仓库 |
| [MCP 起始模板](./templates/mcp-ts-starter/) | 黄金标准技能模板 |

---

## 🛠️ 技术栈

| 组件 | 技术 |
|-----------|------------|
| **运行时** | Bun (2026 最快 JS 运行时) |
| **协议** | MCP 2026 规范 |
| **语言** | TypeScript 5.x |
| **架构** | 自主技能工厂 |
| **标准** | Deep Agent 2026 |

---

## 📱 联系我们

<div align="center">

<img src="aiwork4me.jpg" alt="AIwork4me 二维码" width="180"/>

**扫码获取最新 Deep Agent 技能与 MCP 服务**

*一步一步构建未来。*

</div>

---

## 📄 许可证

MIT License © 2026 AIwork4me

---

<div align="center">

**让 AI 替我干活。**

*© 2026 AIwork4me. 由 🤖 Claude Code 精心打造。*

**2026 Deep Agent 标准**: 自愈 | 进度感知 | 安全优先

</div>
