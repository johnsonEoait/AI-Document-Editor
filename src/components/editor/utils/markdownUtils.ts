// HTML to Markdown conversion utilities

/**
 * Converts HTML content to Markdown format
 * @param html HTML string to convert
 * @returns Markdown formatted string
 */
export const htmlToMarkdown = (html: string): string => {
  // Replace HTML tags with Markdown equivalents
  let markdown = html;
  
  // Replace paragraph tags
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
  
  // Replace strong/bold tags
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
  
  // Replace emphasis/italic tags
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
  
  // Replace heading tags
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
  
  // Replace list items
  markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n');
  
  // Replace unordered lists - using workaround for 's' flag
  markdown = markdown.replace(/<ul>([^]*?)<\/ul>/g, '$1\n');
  
  // Replace ordered lists - using workaround for 's' flag
  markdown = markdown.replace(/<ol>([^]*?)<\/ol>/g, '$1\n');
  
  // Replace blockquotes - using workaround for 's' flag
  markdown = markdown.replace(/<blockquote>([^]*?)<\/blockquote>/g, '> $1\n');
  
  // Replace code blocks - using workaround for 's' flag
  markdown = markdown.replace(/<pre><code>([^]*?)<\/code><\/pre>/g, '```\n$1\n```\n');
  
  // Replace inline code
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
  
  // Replace links
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
  
  // Replace images
  markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)">/g, '![$2]($1)');
  
  // Replace line breaks
  markdown = markdown.replace(/<br>/g, '\n');
  
  // Replace horizontal rules
  markdown = markdown.replace(/<hr>/g, '---\n');
  
  // Clean up extra spaces and line breaks
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = markdown;
  markdown = textarea.value;
  
  return markdown;
};

/**
 * Cleans and processes generated content for insertion
 * @param content Content to clean
 * @returns Cleaned content
 */
export const cleanGeneratedContent = (content: string): string => {
  if (!content) return '';

  // HTML 实体解码函数
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // 更彻底地清理生成的内容
  let cleanedContent = content;
  
  // 1. 解码 HTML 实体
  cleanedContent = decodeHtmlEntities(cleanedContent);
  
  // 2. 移除所有 Markdown 标记中的转义反斜杠
  cleanedContent = cleanedContent.replace(/\\([\\`*_{}\[\]()#+\-.!|>~=])/g, '$1');
  
  // 3. 特别处理常见的 Markdown 语法
  cleanedContent = cleanedContent.replace(/\\\*/g, '*');
  cleanedContent = cleanedContent.replace(/\\_/g, '_');
  cleanedContent = cleanedContent.replace(/\\\[/g, '[');
  cleanedContent = cleanedContent.replace(/\\\]/g, ']');
  cleanedContent = cleanedContent.replace(/\\\(/g, '(');
  cleanedContent = cleanedContent.replace(/\\\)/g, ')');
  cleanedContent = cleanedContent.replace(/\\`/g, '`');
  cleanedContent = cleanedContent.replace(/\\\\/g, '\\');
  
  // 4. 处理特殊的 HTML 标签
  cleanedContent = cleanedContent.replace(/&lt;/g, '<');
  cleanedContent = cleanedContent.replace(/&gt;/g, '>');
  cleanedContent = cleanedContent.replace(/&amp;/g, '&');
  cleanedContent = cleanedContent.replace(/&quot;/g, '"');
  cleanedContent = cleanedContent.replace(/&#39;/g, "'");

  // 检查内容是否包含HTML标签
  const containsHtml = /<[a-z][\s\S]*>/i.test(cleanedContent);
  
  // 如果包含HTML标签，转换为Markdown
  if (containsHtml) {
    cleanedContent = htmlToMarkdown(cleanedContent);
  }

  return cleanedContent;
}; 