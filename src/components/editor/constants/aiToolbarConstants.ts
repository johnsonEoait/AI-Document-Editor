import { FormatOption } from '../types/aiToolbar';
import MarkdownIt from 'markdown-it';

// 初始化 markdown-it 实例
export const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

// 格式化选项列表
export const FORMAT_OPTIONS: FormatOption[] = [
  { label: '标题 1', value: 'h1', icon: 'H1' },
  { label: '标题 2', value: 'h2', icon: 'H2' },
  { label: '标题 3', value: 'h3', icon: 'H3' },
  { label: '加粗', value: 'bold', icon: 'B' },
  { label: '斜体', value: 'italic', icon: 'I' },
  { label: '引用', value: 'blockquote', icon: '>' },
  { label: '无序列表', value: 'list', icon: '•' },
  { label: '有序列表', value: 'numbered-list', icon: '1.' },
  { label: '代码', value: 'code', icon: '</>' },
  { label: '表格', value: 'table', icon: '⊞' },
]; 