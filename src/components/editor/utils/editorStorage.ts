import { Editor } from '@tiptap/react';
import { SavedContent, ToastMessage } from '../types/editor';

// 从本地存储加载内容
export const loadSavedContent = () => {
  try {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage 不可用');
      return null;
    }

    const savedData = localStorage.getItem('editor-content');
    if (!savedData) {
      console.log('未找到保存的内容');
      return null;
    }

    const parsedData = JSON.parse(savedData);
    console.log('加载保存的内容:', parsedData);

    // 处理内容中的图片节点
    const processContent = (content: any) => {
      if (!content) return content;

      // 处理节点
      if (content.type === 'customImage') {
        // 处理图片节点
        const attrs = content.attrs || {};
        
        // 确保宽度和高度是数字
        if (attrs.width !== undefined) {
          attrs.width = Number(attrs.width);
          if (isNaN(attrs.width)) attrs.width = null;
        }
        
        if (attrs.height !== undefined) {
          attrs.height = Number(attrs.height);
          if (isNaN(attrs.height)) attrs.height = null;
        }
        
        // 处理宽高比
        if (attrs._originalAspectRatio !== undefined) {
          attrs._originalAspectRatio = Number(attrs._originalAspectRatio);
          if (isNaN(attrs._originalAspectRatio)) attrs._originalAspectRatio = null;
        }
        
        if (attrs._currentAspectRatio !== undefined) {
          attrs._currentAspectRatio = Number(attrs._currentAspectRatio);
          if (isNaN(attrs._currentAspectRatio)) attrs._currentAspectRatio = null;
        }
        
        // 如果有宽高但没有宽高比，计算并添加
        if (attrs.width && attrs.height && !attrs._originalAspectRatio) {
          attrs._originalAspectRatio = attrs.width / attrs.height;
          attrs._currentAspectRatio = attrs._originalAspectRatio;
          console.log('计算并添加宽高比:', attrs._originalAspectRatio);
        }
        
        // 如果只有一个维度有效，并且有宽高比，计算另一个维度
        if (attrs.width && (!attrs.height || isNaN(attrs.height)) && attrs._originalAspectRatio) {
          attrs.height = attrs.width / attrs._originalAspectRatio;
          console.log('根据宽度和宽高比计算高度:', attrs.height);
        } else if (attrs.height && (!attrs.width || isNaN(attrs.width)) && attrs._originalAspectRatio) {
          attrs.width = attrs.height * attrs._originalAspectRatio;
          console.log('根据高度和宽高比计算宽度:', attrs.width);
        }
        
        console.log('加载图片尺寸:', {
          width: attrs.width,
          height: attrs.height,
          originalAspectRatio: attrs._originalAspectRatio,
          currentAspectRatio: attrs._currentAspectRatio
        });
        
        content.attrs = attrs;
      }

      // 递归处理子节点
      if (content.content && Array.isArray(content.content)) {
        content.content = content.content.map(processContent);
      }

      return content;
    };

    // 处理内容
    if (parsedData.content) {
      parsedData.content = processContent(parsedData.content);
    }

    return parsedData;
  } catch (error) {
    console.error('加载内容时出错:', error);
    return null;
  }
};

// 保存内容到本地存储
export const saveContent = (
  editor: Editor,
  title: string,
  isDebounced: boolean = true,
  setLastSaveTime?: (time: string) => void,
  setToast?: (toast: ToastMessage | null) => void
) => {
  try {
    if (!editor) {
      console.warn('编辑器实例不存在，无法保存');
      return;
    }

    // 确保编辑器状态已更新
    editor.view.updateState(editor.view.state);

    // 获取完整的编辑器内容
    const content = editor.getJSON();
    console.log('保存前的原始内容:', JSON.stringify(content, null, 2).substring(0, 500) + '...');

    // 处理内容中的图片节点
    let imageNodes = 0;
    const processContent = (node: any) => {
      if (!node) return node;

      // 处理图片节点
      if (node.type === 'customImage') {
        imageNodes++;
        const attrs = node.attrs || {};
        
        // 记录原始值以便调试
        const originalWidth = attrs.width;
        const originalHeight = attrs.height;
        const originalAspectRatio = attrs._originalAspectRatio;
        const currentAspectRatio = attrs._currentAspectRatio;
        
        // 确保宽度和高度是数字
        if (attrs.width !== undefined) {
          attrs.width = Number(attrs.width);
          if (isNaN(attrs.width) || attrs.width <= 0) {
            console.warn('无效的宽度值:', originalWidth);
            attrs.width = null;
          }
        }
        
        if (attrs.height !== undefined) {
          attrs.height = Number(attrs.height);
          if (isNaN(attrs.height) || attrs.height <= 0) {
            console.warn('无效的高度值:', originalHeight);
            attrs.height = null;
          }
        }
        
        // 处理宽高比
        if (attrs._originalAspectRatio !== undefined) {
          attrs._originalAspectRatio = Number(attrs._originalAspectRatio);
          if (isNaN(attrs._originalAspectRatio) || attrs._originalAspectRatio <= 0) {
            console.warn('无效的原始宽高比:', originalAspectRatio);
            attrs._originalAspectRatio = null;
          }
        }
        
        if (attrs._currentAspectRatio !== undefined) {
          attrs._currentAspectRatio = Number(attrs._currentAspectRatio);
          if (isNaN(attrs._currentAspectRatio) || attrs._currentAspectRatio <= 0) {
            console.warn('无效的当前宽高比:', currentAspectRatio);
            attrs._currentAspectRatio = null;
          }
        }
        
        // 如果有宽高但没有宽高比，计算并添加
        if (attrs.width && attrs.height && !attrs._originalAspectRatio) {
          attrs._originalAspectRatio = attrs.width / attrs.height;
          attrs._currentAspectRatio = attrs._originalAspectRatio;
          console.log('计算并添加宽高比:', attrs._originalAspectRatio);
        }
        
        // 如果只有一个维度有效，并且有宽高比，计算另一个维度
        if (attrs.width && (!attrs.height || attrs.height <= 0) && attrs._originalAspectRatio) {
          attrs.height = Math.round(attrs.width / attrs._originalAspectRatio);
          console.log('根据宽度和宽高比计算高度:', attrs.height);
        } else if (attrs.height && (!attrs.width || attrs.width <= 0) && attrs._originalAspectRatio) {
          attrs.width = Math.round(attrs.height * attrs._originalAspectRatio);
          console.log('根据高度和宽高比计算宽度:', attrs.width);
        }
        
        console.log('保存图片尺寸:', {
          original: { width: originalWidth, height: originalHeight },
          processed: { width: attrs.width, height: attrs.height },
          aspectRatio: {
            original: originalAspectRatio,
            current: currentAspectRatio,
            calculated: attrs.width && attrs.height ? attrs.width / attrs.height : null
          }
        });
        
        node.attrs = attrs;
      }

      // 递归处理子节点
      if (node.content && Array.isArray(node.content)) {
        node.content = node.content.map(processContent);
      }

      return node;
    };

    // 处理内容
    const processedContent = processContent(content);
    console.log(`处理了 ${imageNodes} 个图片节点`);

    // 准备要保存的数据
    const dataToSave: SavedContent = {
      content: processedContent,
      title: title || '无标题文档',
      lastSaved: new Date().toISOString()
    };

    // 保存到本地存储
    const serializedData = JSON.stringify(dataToSave);
    localStorage.setItem('editor-content', serializedData);
    console.log('内容已保存到本地存储，长度:', serializedData.length);
    
    // 验证保存是否成功
    const savedData = localStorage.getItem('editor-content');
    if (savedData) {
      if (savedData === serializedData) {
        console.log('验证成功: 内容已正确保存到localStorage');
      } else {
        console.warn('验证警告: 保存的内容与原始内容不匹配');
      }
    } else {
      console.error('验证失败: localStorage中未找到保存的内容');
    }

    // 更新最后保存时间
    if (setLastSaveTime) {
      setLastSaveTime(new Date().toLocaleTimeString());
    }

    // 显示保存成功提示
    if (!isDebounced && setToast) {
      setToast({
        open: true,
        message: '内容已保存',
        type: 'success'
      });
    }
  } catch (error) {
    console.error('保存内容时出错:', error);
    
    // 显示保存失败提示
    if (setToast) {
      setToast({
        open: true,
        message: '保存失败',
        type: 'error'
      });
    }
  }
}; 