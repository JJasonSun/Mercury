import type { Article, ArticleContent, Feed, OpmlFeed, OpmlImportResult } from '../main/types'

export {}

declare global {
  interface Window {
    electronAPI?: {
      getFeedList: () => Promise<Feed[]>
      getArticleList: (feedId: string) => Promise<Article[]>
      getAllArticles: () => Promise<Article[]>
      getUnreadArticles: () => Promise<Article[]>
      getArticleContent: (articleId: string) => Promise<ArticleContent>
      addFeed: (url: string) => Promise<Feed>
      updateFeed: (
        feedId: string,
        updates: { title?: string; url?: string; refreshIntervalMinutes?: number }
      ) => Promise<Feed>
      resetFeedTitle: (feedId: string) => Promise<Feed>
      deleteFeed: (feedId: string) => Promise<void>
      refreshFeed: (feedId: string) => Promise<Article[]>
      refreshAllFeeds: () => Promise<void>
      selectOpmlFile: () => Promise<string | null>
      selectOpmlExportPath: () => Promise<string | null>
      previewOpml: (filePath: string) => Promise<OpmlFeed[]>
      getPathForFile: (file: File) => string
      importOpml: (filePath: string) => Promise<OpmlImportResult>
      importOpmlFeeds: (feeds: OpmlFeed[]) => Promise<OpmlImportResult>
      exportOpml: (filePath: string) => Promise<void>
      markArticleRead: (articleId: string) => Promise<void>
      markArticleUnread: (articleId: string) => Promise<void>
      summarizeArticle: (articleId: string) => Promise<string>
      translateArticle: (articleId: string, targetLang: string) => Promise<string>
      addTag: (articleId: string, tagName: string) => Promise<void>
      exportMarkdown: (articleId: string) => Promise<void>
    }
  }
}
