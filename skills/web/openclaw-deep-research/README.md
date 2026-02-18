# OpenClaw Deep Research

> Multi-step search & scrape with OpenClaw integration

<div align="center">

<img src="https://img.shields.io/badge/AIwork4me-Skill-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/Category-Web-4A90D9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Production-22C55E?style=for-the-badge" />

</div>

---

## 📋 Overview

The **OpenClaw Deep Research** skill provides intelligent, multi-step web research capabilities. It leverages OpenClaw for advanced search and scraping with automatic content extraction, relevance scoring, and query expansion.

### Key Features

- **Multi-step Research**: Automatically expands queries with related searches
- **Content Extraction**: Optionally extracts full page content
- **Relevance Scoring**: Results ranked by relevance to your query
- **Skill-Link Compatible**: Output can chain to other AIwork4me skills

---

## 🚀 Usage

### Basic Research

```typescript
import { execute } from "@aiwork4me/openclaw-deep-research";

const result = await execute({
  query: "MCP protocol 2026 specification",
});

console.log(result.results);
// [
//   {
//     title: "Model Context Protocol 2026...",
//     url: "https://...",
//     snippet: "...",
//     relevance: 0.92
//   },
//   ...
// ]
```

### Advanced Research with Options

```typescript
const result = await execute({
  query: "LangGraph deep agents architecture",
  options: {
    depth: 3,              // Search depth (1-5)
    maxResults: 20,        // Maximum results
    extractContent: true,  // Extract full content
    includeRelated: true,  // Include related queries
    dateRange: "month",    // Filter by date
  },
});
```

---

## 🔗 Skill-Link

This skill is **Skill-Link compatible**. Chain it with other skills:

```typescript
import { execute as research } from "@aiwork4me/openclaw-deep-research";
import { execute as summarize } from "@aiwork4me/ai-summarizer";

// Step 1: Research
const researchResult = await research({
  query: "MCP protocol 2026",
  options: { extractContent: true },
});

// Step 2: Summarize (using Skill-Link)
const summary = await summarize({
  content: researchResult.results.map(r => r.content).join("\n\n"),
  chainHistory: researchResult.chainHistory,
});
```

**Suggested Next Skills:**
- `ai-summarizer` - Summarize research results
- `content-extractor` - Extract structured data
- `github-issue-bot` - Create issue from findings

---

## 📚 API Reference

### `execute(input: ResearchInput): Promise<ResearchOutput>`

Execute deep research.

#### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Search query |
| `options.depth` | number | | Search depth (1-5) |
| `options.maxResults` | number | | Max results (default: 10) |
| `options.extractContent` | boolean | | Extract full content |
| `options.includeRelated` | boolean | | Include related queries |
| `options.dateRange` | string | | Filter: day/week/month/year/all |
| `options.timeout` | number | | Request timeout (ms) |

#### Output

```typescript
interface ResearchOutput {
  results: SearchResult[];
  metadata: ScrapingMetadata;
  nextSkillHint?: string;
  chainHistory?: string[];
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCLAW_API_KEY` | ✅ | OpenClaw API key |
| `OPENCLAW_ENDPOINT` | | Custom API endpoint |

---

## 🧪 Testing

```bash
# Run tests
bun test

# Run with coverage
bun test --coverage
```

---

## 📖 Examples

### Research & Summarize Pipeline

```typescript
const pipeline = async (topic: string) => {
  // 1. Deep research
  const research = await execute({
    query: topic,
    options: { depth: 2, maxResults: 5, extractContent: true },
  });

  // 2. Process results
  const topResults = research.results
    .filter(r => r.relevance > 0.7)
    .slice(0, 3);

  return {
    topic,
    sources: topResults.map(r => ({
      title: r.title,
      url: r.url,
      summary: r.snippet,
    })),
    metadata: research.metadata,
  };
};
```

---

<div align="center">

*Part of [AIwork4me](https://github.com/AIwork4me) ecosystem.*

**Let AI work for me.**

</div>
