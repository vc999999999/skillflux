# SkillFlux Plugin 项目说明

## 一、项目概述

SkillFlux Plugin 是一个**本地多 Agent Harness 插件**，用于观察 AI 模型请求、注入结构化元数据（信号），并转发至远程 SkillFlux 网关进行进一步编排。当前 MVP 聚焦于 **legal-writer**（法律文书写作）场景。

- **语言/运行时**: TypeScript (ESM) / Node.js ≥22
- **架构**: pnpm monorepo，分层设计
- **支持平台**: Claude Code、Codex

---

## 二、项目结构

```
skillflux/
├── .claude-plugin/          → Claude Code 市场元数据 (marketplace.json)
├── .agents/plugins/         → Codex 市场元数据 (marketplace.json)
├── plugins/
│   └── skillflux/
│       ├── .claude-plugin/  → Claude Code 插件清单 (plugin.json)
│       └── .codex-plugin/   → Codex 插件清单 (plugin.json)
├── packages/
│   ├── core/                → 核心库（检测、信号、会话、网关）
│   ├── cli/                 → CLI 工具 (skillflux-harness)
│   └── industries/          → 行业清单 & 检查
│       └── legal/           → 法律行业（legal-writer 检查）
├── legal-writer/            → 法律文书技能定义（SKILL.md、错误库、参考、验证脚本）
├── docs/                    → 架构、适配器指南、字段映射、网关边界
├── schemas/                 → JSON Schema（配置、信号、行业清单）
├── examples/                → 示例配置 & 请求 JSON
├── tests/                   → 单元测试
└── package.json             → 根包（bin: skillflux-harness）
```

---

## 三、触发机制详解

### 3.1 触发模式

SkillFlux 插件支持两种触发模式，通过配置 `trigger_mode` 控制：

| 模式 | 值 | 说明 |
|------|-----|------|
| **手动模式** (默认) | `"manual"` | 仅在用户显式调用时触发（slash 命令 `/legal-writer` 或平台命令） |
| **自动模式** (旧版) | `"auto"` | 自动拦截所有模型请求 |

当前默认为 **手动模式**，插件不会自动拦截任何请求。

### 3.2 手动模式下的触发场景

| 触发场景 | 说明 |
|----------|------|
| **Claude Code /legal-writer** | 用户输入 `/legal-writer` → 识别为显式调用 → 触发 harness 流程 |
| **Codex /legal-writer** | 用户选择插件或输入 `/legal-writer` → 触发 |
| **CLI 手动调用** | `skillflux-harness detect/check/debug/session/doctor` → 手动触发 |

> **注意**: 在手动模式下，普通对话（无 `/legal-writer` 前缀）不会触发 harness，请求原样透传。

### 3.3 触发后的执行流程（请求生命周期）

每次有效触发后，核心函数 `buildHarnessRequest` 执行以下 **8 步流程**：

```
步骤 1: 加载配置 (loadHarnessConfig)
         → 读取 .skillflux-harness.json，合并默认值
         → 如果 enabled=false 或未找到配置 → 降级模式（原样透传）

步骤 2: 检测请求格式 (detectRequestShape)
         → 判断请求属于哪种 API 格式：
           • chat    → OpenAI Chat API（有 messages 数组，无 max_tokens）
           • claude  → Claude Messages API（有 max_tokens + messages）
           • responses → OpenAI Responses API（有 input/previous_response_id）
           • unknown → 无法识别 → 降级模式

步骤 3: 触发模式检查 (isExplicitInvocation)
         → manual 模式：检查请求是否有显式调用标记
           • skillflux_explicit_invocation: true 元数据标记
           • 用户文本含 /legal-writer、/skillflux slash 命令
           → 无标记 → 降级模式（原样透传，不注入信号）
         → auto 模式：跳过此检查，所有请求都处理

步骤 4: 获取/创建会话 ID (currentSession)
         → 同一 sessionKey 在 TTL 内复用同一个 sess_xxx ID
         → 跨任务或 TTL 过期后生成新会话

步骤 4: 运行本地检查 (runLegalWriterCheck)
         → 对用户输入文本执行正则匹配：
           • 检测文档类型（投诉书、律师函、合同、备忘录等）
           • 检测是否包含当事人姓名
           • 检测是否包含索赔/条款关键词
           • 检测是否有法律依据（引用法域）
           • 评估风险等级（高/中/低/未知）

步骤 5: 构建信号 (buildHarnessSignals)
         → 组装 SkillFluxHarnessMetadata 对象：
           session_id, profile, client, plugin_version,
           enhance_mode, industry_hint, task_hint,
           request_type, artifact_type, step_hint,
           local_checks
         → 同时构建 x-sf-* 头信息映射

步骤 6: 注入元数据 (injectHarnessMetadata)
         → 将 metadata.skillflux_harness 写入请求对象
         → 保留已有 metadata 不覆盖

步骤 7: 返回结果
         → 返回 HarnessBuildResult：
           { request, headers, signals, requestFormat, degraded, diagnostics }
```

### 3.4 降级模式（不触发信号注入）

以下情况插件会进入**降级模式**，原样透传请求，不注入任何信号：

- 配置文件中 `enabled: false`
- 未找到配置文件
- 请求格式为 `unknown`（无法识别的 API 格式）
- **手动模式下无显式调用标记**（新增）

降级模式下，请求不受任何修改，直接传递给模型。

### 3.5 信号字段说明

每次成功触发后注入的信号包含以下字段：

| 字段 | 含义 | 示例值 |
|------|------|--------|
| `session_id` | 会话唯一标识 | `sess_a1b2c3d4` |
| `profile` | 当前技能 profile | `legal-writer` |
| `client` | 来源平台 | `claude-code` / `codex` |
| `plugin_version` | 插件版本 | `0.1.0` |
| `enhance_mode` | 增强模式 | `standard` |
| `industry_hint` | 行业提示 | `legal` |
| `task_hint` | 任务提示 | `draft-complaint` |
| `request_type` | 请求类型 | `chat` / `claude` / `responses` |
| `artifact_type` | 文档类型 | `complaint` / `memo` |
| `step_hint` | 步骤提示 | `draft` / `review` |
| `local_checks` | 本地检查结果 | `{document_type, risk_level, ...}` |

### 3.6 本地检查触发细节（legal-writer）

当 `profile` 为 `legal-writer` 时，本地检查会对用户文本执行以下正则匹配：

1. **文档类型检测**: 匹配英文/中文法律文书关键词
   - 投诉书 (complaint)、律师函 (demand letter)、合同 (contract)
   - 备忘录 (memo)、案情摘要 (brief)、隐私政策 (privacy policy)
   - 服务条款 (terms of service)

2. **当事人姓名检测**: 匹配姓名模式（英文人名或中文名字）

3. **索赔/条款检测**: 匹配 "claims"/"breach"/"违约" 等关键词

4. **法律依据检测**: 匹配法域引用（如 "U.S.C."、"Cal. Code"）

5. **风险评估**: 基于严重程度关键词判断风险等级
   - 高风险: 含 "class action"/"injunction"/"criminal" 等
   - 中风险: 含 "damages"/"penalty"/"liability" 等
   - 低风险: 含 "review"/"opinion"/"advisory" 等
   - 未知: 无匹配关键词

---

## 四、配置与启用

### 用户配置文件: `.skillflux-harness.json`

```json
{
  "enabled": true,
  "trigger_mode": "manual",
  "profile": "legal-writer",
  "industry": "legal",
  "enhance_mode": "standard",
  "gateway_base_url": "https://gateway.skillflux.ai",
  "session": { "ttl_seconds": 3600 },
  "checks": { "legal_writer": true }
}
```

- `enabled: false` → 不触发任何信号注入（降级模式）
- `checks.legal_writer: false` → 跳过本地法律文书检查
- `gateway_base_url` → 指定远程网关地址

---

## 五、CLI 工具触发方式

```bash
skillflux-harness detect   # 检测请求格式
skillflux-harness check    # 运行本地检查
skillflux-harness debug    # 输出诊断信息
skillflux-harness session  # 查看/管理会话
skillflux-harness doctor   # 系统健康检查
```

---

## 六、架构分层总结

```
托管 Agent 平台
    ↓ 用户输入 /legal-writer（显式调用）
适配器层（薄层包装，设置 client 字段 + 标记显式调用）
    ↓ 调用 buildHarnessRequest
核心层
    ├─ 配置加载 → 是否启用？trigger_mode？
    ├─ 格式检测 → chat/claude/responses/unknown
    ├─ 显式调用检测 → manual 模式下检查 slash 命令/元数据标记
    ├─ 会话管理 → TTL + sessionKey 复用
    ├─ 本地检查 → 正则匹配法律文书特征
    ├─ 信号构建 → 组装 SkillFluxHarnessMetadata + x-sf-* 头
    └─ 元数据注入 → 写入请求 metadata
    ↓
网关层（可选转发至远程 SkillFlux 网关）
    ↓
返回增强后的请求 → 托管 Agent 平台继续处理
```

**核心原则**: 插件在本地做最少的事（检测、会话、公开检查、信号），将隐藏提示注入、工作流选择、路由、计费等职责委托给远程 SkillFlux 网关。