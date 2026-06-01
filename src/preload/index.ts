import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getFeedList: () => ipcRenderer.invoke('get-feed-list'),
  getArticleList: (feedId: string) => ipcRenderer.invoke('get-article-list', feedId),
  getAllArticles: () => ipcRenderer.invoke('get-all-articles'),
  getUnreadArticles: () => ipcRenderer.invoke('get-unread-articles'),
  getArticleContent: (articleId: string) => ipcRenderer.invoke('get-article-content', articleId),
  addFeed: (url: string) => ipcRenderer.invoke('add-feed', url),
  updateFeed: (feedId: string, updates: { title?: string; url?: string; refreshIntervalMinutes?: number }) =>
    ipcRenderer.invoke('update-feed', feedId, updates),
  resetFeedTitle: (feedId: string) => ipcRenderer.invoke('reset-feed-title', feedId),
  deleteFeed: (feedId: string) => ipcRenderer.invoke('delete-feed', feedId),
  refreshFeed: (feedId: string) => ipcRenderer.invoke('refresh-feed', feedId),
  refreshAllFeeds: () => ipcRenderer.invoke('refresh-all-feeds'),
  selectOpmlFile: () => ipcRenderer.invoke('select-opml-file'),
  selectOpmlExportPath: () => ipcRenderer.invoke('select-opml-export-path'),
  previewOpml: (filePath: string) => ipcRenderer.invoke('preview-opml', filePath),
  getPathForFile: (file: Parameters<typeof webUtils.getPathForFile>[0]) => webUtils.getPathForFile(file),
  importOpml: (filePath: string) => ipcRenderer.invoke('import-opml', filePath),
  importOpmlFeeds: (feeds: Array<{ title: string; url: string }>) =>
    ipcRenderer.invoke(
      'import-opml-feeds',
      feeds.map((feed) => ({
        title: String(feed.title || feed.url),
        url: String(feed.url)
      }))
    ),
  exportOpml: (filePath: string) => ipcRenderer.invoke('export-opml', filePath),
  markArticleRead: (articleId: string) => ipcRenderer.invoke('mark-article-read', articleId),
  markArticleUnread: (articleId: string) => ipcRenderer.invoke('mark-article-unread', articleId),
  summarizeArticle: (articleId: string) => ipcRenderer.invoke('summarize-article', articleId),
  translateArticle: (articleId: string, targetLang: string) => ipcRenderer.invoke('translate-article', articleId, targetLang),
  addTag: (articleId: string, tagName: string) => ipcRenderer.invoke('add-tag', articleId, tagName),
  exportMarkdown: (articleId: string) => ipcRenderer.invoke('export-markdown', articleId)
})
