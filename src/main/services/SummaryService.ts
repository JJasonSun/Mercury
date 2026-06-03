/**
 * SummaryService
 * 实现 ISummaryService 接口，集成 SummaryAgent 生成文章摘要
 *
 * 第二周：使用 mock Markdown 数据，不依赖模块 B 的 CleaningService
 * 第三周：将对接 CleaningService 获取真实 cleaned Markdown，并将摘要结果写入数据库
 */

import { ISummaryService } from './interfaces'
import { SummaryAgent } from '../llm/agents'
import type { LLMProviderConfig } from '../llm/config'

/**
 * Mock Markdown 内容（第二周使用）
 * 后续将替换为 CleaningService.clean() 返回的真实数据
 */
const MOCK_MARKDOWN = `# 如何高效学习编程

编程学习是一个循序渐进的过程，需要持续的练习和思考。

## 核心原则

1. **动手实践**：理论结合实践，通过项目驱动学习
2. **刻意练习**：针对薄弱环节反复练习
3. **代码阅读**：阅读优秀的开源项目代码

## 学习路径

建议从基础语法开始，逐步深入到数据结构、算法、设计模式等高级主题。

## 总结

坚持每天编码，保持好奇心，善用社区资源，你一定能成为优秀的开发者。`

export class SummaryService implements ISummaryService {
  private agent: SummaryAgent

  /**
   * 创建 SummaryService 实例
   * @param config LLM 配置（baseUrl / apiKey / model）
   * @param agent 可选的 SummaryAgent 实例（用于 mock 测试），
   *              若未提供则自动创建
   */
  constructor(config: LLMProviderConfig, agent?: SummaryAgent) {
    this.agent = agent ?? new SummaryAgent(config)
  }

  /**
   * 生成文章摘要
   * @param articleId 文章 ID
   * @returns 摘要字符串
   * @throws Error 当 articleId 为空时抛出 "Article ID cannot be empty"
   * @throws Error 当摘要生成失败时重新抛出
   */
  async summarize(articleId: string): Promise<string> {
    // 验证 articleId 不为空
    if (!articleId || articleId.trim() === '') {
      throw new Error('Article ID cannot be empty')
    }

    // 第二周：使用 mock Markdown 数据
    // TODO: 第三周替换为 CleaningService.clean() 获取真实 cleaned Markdown
    const markdown = MOCK_MARKDOWN

    try {
      const summary = await this.agent.summarize(markdown)
      return summary
    } catch (err) {
      // 捕获 SummaryAgent 内部错误并重新抛出
      throw new Error(
        `Failed to generate summary for article "${articleId}": ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}
