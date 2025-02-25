import { Editor } from '@tiptap/react';
import { SavedContent, ToastMessage } from '../types/editor';

// 从本地存储加载内容
export const loadSavedContent = (): SavedContent | null => {
  try {
    // 检查 localStorage 是否可用
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedData = localStorage.getItem('editor-content');
      if (savedData) {
        return JSON.parse(savedData) as SavedContent;
      }
    }
  } catch (error) {
    console.error('加载保存的内容失败:', error);
  }
  return null;
};

// 保存内容到本地存储
export const saveContent = (
  editor: Editor, 
  title: string, 
  isAuto = false,
  setLastSaveTime: (time: string) => void,
  setToast: (toast: ToastMessage | null) => void
): void => {
  if (!editor) return;
  
  try {
    const content = editor.getJSON();
    localStorage.setItem('editor-content', JSON.stringify({
      content,
      title,
      lastSaved: new Date().toISOString()
    }));
    setLastSaveTime(new Date().toLocaleTimeString());
    setToast({ 
      message: isAuto ? '已自动保存' : '文档已保存', 
      type: 'success' 
    });
    
    // 3秒后清除提示
    setTimeout(() => {
      setToast(null);
    }, 3000);
  } catch (error) {
    console.error('保存失败:', error);
    setToast({ message: '保存失败，请重试', type: 'error' });
  }
}; 