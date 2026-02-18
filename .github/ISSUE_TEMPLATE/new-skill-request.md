---
name: New Skill Request
about: Request a new MCP skill to be added to AIwork4me
title: '[SKILL] '
labels: 'skill-request, ai-parseable'
assignees: ''
---

<!--
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🤖 AI-PARSEABLE SKILL REQUEST                          ║
║                                                                           ║
║  This template is designed to be machine-readable by Claude Code.         ║
║  Fill in the structured fields below and Claude will auto-generate       ║
║  the skill code.                                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
-->

## 📋 Skill Metadata

```yaml
skill_name: ""
category: "" # web | code | data | automation
capability: ""
mcp_command: "" # e.g., mcp__skill_name__main
```

## 🎯 Description

<!-- What does this skill do? Be specific and concise. -->

**Problem it solves:**

**Expected behavior:**

## 📥 Input Schema

<!-- Define the input parameters this skill should accept -->

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "Description of param1"
      }
    },
    "required": ["param1"]
  }
}
```

## 📤 Output Schema

<!-- Define the output this skill should produce -->

```json
{
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": {
        "type": "string",
        "description": "Description of result"
      }
    }
  }
}
```

## 🔗 Skill-Link Configuration

```yaml
skill_link_compatible: true # true | false
suggested_next_skills: [] # e.g., ["ai-summarizer", "content-extractor"]
input_type: ""
output_type: ""
```

## 🔧 Dependencies

<!-- List any npm packages or external APIs needed -->

```yaml
dependencies:
  npm: [] # e.g., ["axios", "cheerio"]
  external_apis: [] # e.g., ["OpenAI API", "GitHub API"]
  environment_vars: [] # e.g., ["API_KEY"]
```

## 📝 Examples

### Example 1: Basic Usage

```typescript
const result = await execute({
  // input here
});
```

### Example 2: Advanced Usage

```typescript
const result = await execute({
  // advanced input here
});
```

## ✅ Acceptance Criteria

- [ ] Skill scaffolding created
- [ ] MCP config validated
- [ ] Unit tests written
- [ ] Documentation complete
- [ ] Skill-Link compatible

---

## 🤖 AI Processing Section

<!-- DO NOT EDIT BELOW - Claude Code will fill this section -->

```yaml
_status: pending
_created_at:
_assigned_to:
_pr_number:
```
