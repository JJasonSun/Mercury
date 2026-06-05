/**
 * TranslationService
 * 实现 ITranslationService 接口，集成 TranslationAgent 生成文章翻译
 */

import { ITranslationService } from './interfaces'
import { TranslationAgent } from '../llm/agents'
import type { LLMProviderConfig } from '../llm/config'
import type { Repository } from '../database/repository'
import type { ICleaningService } from './interfaces'

export class TranslationService implements ITranslationService {
  private agent: TranslationAgent
  private repository: Repository
  private cleaningService: ICleaningService

  /**
   * 创建 TranslationService 实例
   * @param config LLM 配置（baseUrl / apiKey / model）
   * @param repository 数据仓库
   * @param cleaningService 内容清洗服务
   * @param agent 可选的 TranslationAgent 实例（用于 mock 测试），
   *              若未提供则自动创建
   */
  constructor(
    config: LLMProviderConfig,
    repository: Repository,
    cleaningService: ICleaningService,
    agent?: TranslationAgent
  ) {
    this.repository = repository
    this.cleaningService = cleaningService
    this.agent = agent ?? new TranslationAgent(config)
  }

  /**
   * 翻译文章
   * @param articleId 文章 ID
   * @param targetLang 目标语言（如 'en', 'ja', 'ko'）
   * @returns 翻译后的字符串
   * @throws Error 当 articleId 为空时抛出 "Article ID cannot be empty"
   * @throws Error 当 targetLang 为空时抛出 "Target language cannot be empty"
   * @throws Error 当文章内容为空时抛出 "Article content not found"
   * @throws Error 当翻译生成失败时重新抛出
   */
  async translate(articleId: string, targetLang: string): Promise<string> {
    // 验证参数
    if (!articleId || articleId.trim() === '') {
      throw new Error('Article ID cannot be empty')
    }
    if (!targetLang || targetLang.trim() === '') {
      throw new Error('Target language cannot be empty')
    }

    // 获取文章内容
    const content = this.repository.getArticleContent(articleId)
    if (!content) {
      throw new Error('Article content not found')
    }

    // 获取 cleaned Markdown
    let markdown = content.cleanedMarkdown
    if (!markdown) {
      // 如果没有 cleaned Markdown，尝试清洗 rawHtml
      if (content.rawHtml) {
        const cleaned = await this.cleaningService.clean(content.rawHtml, content.sourceUrl)
        markdown = cleaned.cleanedMarkdown
      } else {
        throw new Error('Article content is empty')
      }
    }

    // 保存运行记录
    const agentRunId = this.repository.saveAgentRun(articleId, 'translation', markdown)

    try {
      // 调用 TranslationAgent 生成翻译
      const translation = await this.agent.translate(markdown, targetLang, {
        title: content.title
      })

      // 更新运行状态为成功
      this.repository.updateAgentRunStatus(agentRunId, 'completed', translation)

      // 记录 token 用量（如果有的话）
      // 注意：当前实现中 LLMResponse 不返回 usage，这里预留接口
      // this.repository.saveLLMUsage(agentRunId, model, promptTokens, completionTokens, totalTokens)

      return translation
    } catch (err) {
      // 更新运行状态为失败
      this.repository.updateAgentRunStatus(agentRunId, 'failed', undefined, err instanceof Error ? err.message : String(err))
      throw new Error(
        `Failed to generate translation for article "${articleId}": ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}
