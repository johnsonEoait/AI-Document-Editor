'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FloatingAIToolbarProps, SelectionRange, AIProcessMode, SparkleEffect, DragState } from './types/aiToolbar';
import { createAIHighlightPlugin } from './utils/aiHighlightPlugin';
import { calculateToolbarPosition, createSparkleEffects } from './utils/aiToolbarPosition';
import { handleAIRequest } from './utils/aiRequestHandler';
import { cleanGeneratedContent } from './utils/markdownUtils';
import './styles/aiToolbar.css';

// 导入子组件
import { AIToolbarHeader } from './components/AIToolbarHeader';
import { AIToolbarInput } from './components/AIToolbarInput';
import { AIToolbarFooter } from './components/AIToolbarFooter';
import { AIGeneratedContent } from './components/AIGeneratedContent';
import { AISelectedText } from './components/AISelectedText';
import { AISparkleEffect } from './components/AISparkleEffect';
import { AIGeneratedImage } from './components/AIGeneratedImage';

export const FloatingAIToolbar = ({ editor, onLoadingChange }: FloatingAIToolbarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number, aspectRatio: string } | null>(null);
  const [mode, setMode] = useState<AIProcessMode>('process');
  const [formatType, setFormatType] = useState<string>('');
  const [sparkles, setSparkles] = useState<SparkleEffect[]>([]);
  
  const selectionRef = useRef<SelectionRange | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0
  });

  // 创建并注册高亮插件
  useEffect(() => {
    if (!editor) return;

    const { registerPlugin, unregisterPlugin } = createAIHighlightPlugin(editor, selectionRef);
    registerPlugin();

    return () => {
      unregisterPlugin();
    };
  }, [editor]);

  // 计算工具栏位置的函数
  const updateToolbarPosition = useCallback((to: number) => {
    if (!editor) return;

    const newPosition = calculateToolbarPosition(editor, to);
    if (newPosition) {
      setPosition(newPosition);
    }
  }, [editor]);

  // 添加手动触发方法
  const showToolbar = useCallback(() => {
    if (!editor) {
      console.log('showToolbar: editor not available');
      return;
    }

    const { state } = editor;
    const { selection } = state;
    const { empty, ranges } = selection;

    console.log('showToolbar: Selection state:', {
      empty,
      ranges: ranges.map(range => ({
        from: range.$from.pos,
        to: range.$to.pos,
        text: state.doc.textBetween(range.$from.pos, range.$to.pos)
      }))
    });

    let position;
    if (empty) {
      // 如果没有选中内容，使用当前光标位置
      console.log('showToolbar: Using cursor position');
      position = calculateToolbarPosition(editor, selection.from);
      // 设置插入位置为当前光标位置
      selectionRef.current = { from: selection.from, to: selection.from };
    } else {
      // 如果有选中内容，检查是否有效
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));
      
      if (from === to) {
        console.log('showToolbar: Invalid selection range');
        return;
      }

      // 检查选中的节点类型
      const node = editor.state.doc.nodeAt(from);
      console.log('showToolbar: Selected node type:', node?.type.name);
      
      if (node && (node.type.name === 'customImage' || node.type.name === 'table')) {
        console.log('showToolbar: Invalid node type');
        return;
      }

      // 保存选中范围并触发高亮更新
      selectionRef.current = { from, to };
      editor.view.dispatch(editor.state.tr);
      position = calculateToolbarPosition(editor, to);
    }

    // 设置位置并显示工具栏
    if (position) {
      console.log('showToolbar: Setting new position and showing toolbar');
      setPosition(position);
      setIsVisible(true);
      
      // 添加魔法效果 - 生成随机的闪光点
      setSparkles(createSparkleEffects());
    } else {
      console.log('showToolbar: Failed to calculate position');
    }
  }, [editor, calculateToolbarPosition]);

  // 暴露方法给外部使用
  useEffect(() => {
    if (!editor) return;
    
    console.log('Registering aiToolbar.show method');
    editor.aiToolbar = {
      show: showToolbar
    };

    return () => {
      console.log('Unregistering aiToolbar.show method');
      delete editor.aiToolbar;
    };
  }, [editor, showToolbar]);

  // 监听滚动事件，更新工具栏位置
  useEffect(() => {
    if (!editor || !isVisible) return;

    const handleScroll = () => {
      if (selectionRef.current) {
        const { to } = selectionRef.current;
        updateToolbarPosition(to);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    editor.view.dom.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      editor.view.dom.removeEventListener('scroll', handleScroll);
    };
  }, [editor, isVisible, updateToolbarPosition]);

  // 监听选中内容变化，如果选中内容消失则关闭工具栏
  useEffect(() => {
    if (!editor || !isVisible) return;

    const handleSelectionChange = () => {
      const { state } = editor;
      const { selection } = state;
      
      if (selection.empty) {
        handleCancel();
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor, isVisible]);

  // 添加拖拽相关的事件处理
  useEffect(() => {
    if (!isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleInsertContent = () => {
    if (mode === 'image' && generatedImageUrl) {
      // 插入生成的图像
      try {
        if (selectionRef.current) {
          const { from } = selectionRef.current;
          editor.chain().focus().setTextSelection(from).insertContent({
            type: 'customImage',
            attrs: { 
              src: generatedImageUrl,
              // 如果有尺寸信息，添加到图像属性中
              width: imageDimensions?.width,
              height: imageDimensions?.height,
              alt: `AI生成的图像 (${imageDimensions?.aspectRatio || '4:3'})`
            }
          }).run();
        } else {
          editor.commands.insertContent({
            type: 'customImage',
            attrs: { 
              src: generatedImageUrl,
              // 如果有尺寸信息，添加到图像属性中
              width: imageDimensions?.width,
              height: imageDimensions?.height,
              alt: `AI生成的图像 (${imageDimensions?.aspectRatio || '4:3'})`
            }
          });
        }
        
        // 重置状态
        setGeneratedImageUrl('');
        setImageDimensions(null);
        setIsVisible(false);
        setPrompt('');
        setMode('process');
        
        // 延迟清除选中范围和高亮
        setTimeout(() => {
          selectionRef.current = null;
          editor.view.dispatch(editor.state.tr);
        }, 0);
      } catch (error) {
        console.error('Error inserting image:', error);
        alert('插入图像失败，请重试');
      }
      return;
    }

    if (!generatedContent) return;

    try {
      // 清理生成的内容
      const cleanedContent = cleanGeneratedContent(generatedContent);
      
      // 先删除选中的内容
      if (selectionRef.current) {
        const { from, to } = selectionRef.current;
        editor.chain().focus().deleteRange({ from, to }).run();
        
        // 在删除的位置插入新内容
        editor.chain().focus().setTextSelection(from).insertContent(cleanedContent).run();
      } else {
        // 如果没有选中内容，在当前位置插入
        editor.commands.insertContent(cleanedContent);
      }
      
      // 重置状态
      setGeneratedContent('');
      setIsVisible(false);
      setPrompt('');
      setMode('process');
      setFormatType('');
      
      // 延迟清除选中范围和高亮
      setTimeout(() => {
        selectionRef.current = null;
        editor.view.dispatch(editor.state.tr);
      }, 0);
      
    } catch (error) {
      console.error('Error inserting content:', error);
      alert('插入内容失败，请重试');
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent('');
    setGeneratedImageUrl('');
    setImageDimensions(null);
    handleSubmit();
  };

  const handleCancel = () => {
    setGeneratedContent('');
    setGeneratedImageUrl('');
    setImageDimensions(null);
    setIsVisible(false);
    setPrompt('');
    setMode('process');
    setFormatType('');
    selectionRef.current = null;
    editor.view.dispatch(editor.state.tr);
  };

  // 处理格式化选择 - 保留但不再使用
  const handleFormatSelect = (format: string) => {
    // 不再使用格式化功能
  };

  // 处理模式变更
  const handleModeChange = (newMode: AIProcessMode) => {
    // 只允许 'process', 'generate', 'image' 模式
    setMode(newMode);
    setGeneratedContent('');
    setGeneratedImageUrl('');
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY
    };
    document.body.style.cursor = 'move';
  };

  const handleSubmit = async () => {
    if (mode === 'image') {
      // 处理图像生成请求
      if (!prompt.trim()) {
        alert('请输入图像描述');
        return;
      }
      
      setIsLoading(true);
      setGeneratedImageUrl('');
      setImageDimensions(null);
      
      try {
        const response = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: prompt.trim(),
            mode: 'image'
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.details || '图像生成失败');
        }
        
        const data = await response.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          // 保存图像尺寸信息
          if (data.width && data.height && data.aspectRatio) {
            setImageDimensions({
              width: data.width,
              height: data.height,
              aspectRatio: data.aspectRatio
            });
          }
        } else {
          throw new Error('返回的响应没有图像URL');
        }
      } catch (error: any) {
        console.error('图像生成出错:', error);
        alert(error.message || '图像生成出错，请稍后重试');
      } finally {
        setIsLoading(false);
      }
      
      return;
    }
    
    let text = '';
    let insertPosition = { from: 0, to: 0 };
    let isGenerating = false; // 标记是否为生成模式
    
    if (selectionRef.current) {
      const { from, to } = selectionRef.current;
      // 如果 from 和 to 相同，说明是空状态下的光标位置
      if (from === to) {
        isGenerating = true;
        insertPosition = { from, to };
      } else {
        // 有选中内容，获取选中的文本
        text = editor.state.doc.textBetween(from, to, '\n');
        insertPosition = { from, to };
      }
    } else {
      isGenerating = true;
      insertPosition = { 
        from: editor.state.selection.from,
        to: editor.state.selection.from 
      };
    }

    if (!prompt.trim()) {
      alert('请输入提示词');
      return;
    }

    setIsLoading(true);
    onLoadingChange(false); // 不再使用全屏遮罩
    setGeneratedContent(''); // 清空之前的内容

    try {
      // 使用AI请求处理工具函数
      await handleAIRequest(
        {
          text,
          prompt: prompt.trim(),
          mode: isGenerating ? 'generate' : 'process'
        },
        (chunk) => {
          setGeneratedContent(prev => prev + chunk);
        }
      );
    } catch (error: any) {
      console.error('AI 处理出错:', error);
      alert(error.message || 'AI 处理出错，请稍后重试');
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(0)',
        transition: dragRef.current.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'fixed',
      }}
    >
      {/* 魔法闪光效果 */}
      <AISparkleEffect sparkles={sparkles} />
      
      <div className="ai-toolbar-content ai-toolbar-glass w-[500px] overflow-hidden flex flex-col rounded-2xl shadow-lg">
        {/* 工具栏头部 */}
        <AIToolbarHeader 
          onDragStart={handleDragStart} 
          onCancel={handleCancel} 
        />

        <div className="p-4">
          {/* 选中的文本显示 */}
          {mode !== 'image' && (
            <AISelectedText 
              editor={editor} 
              selectionRef={selectionRef} 
            />
          )}

          {/* 输入区域 */}
          <AIToolbarInput 
            prompt={prompt}
            setPrompt={setPrompt}
            mode={mode}
            isLoading={isLoading}
            formatType={formatType}
            selectionRef={selectionRef}
            inputRef={inputRef}
            onSubmit={handleSubmit}
            onFormatSelect={handleFormatSelect}
            onModeChange={handleModeChange}
            editor={editor}
          />

          {/* 底部信息 */}
          <AIToolbarFooter 
            mode={mode} 
            formatType={formatType} 
            selectionRef={selectionRef} 
          />
        </div>

        {/* 生成的内容 */}
        {mode === 'image' ? (
          <AIGeneratedImage 
            imageUrl={generatedImageUrl}
            dimensions={imageDimensions}
            isLoading={isLoading}
            onCancel={handleCancel}
            onRegenerate={handleRegenerate}
            onInsert={handleInsertContent}
          />
        ) : (
          <AIGeneratedContent 
            generatedContent={generatedContent}
            isLoading={isLoading}
            onCancel={handleCancel}
            onRegenerate={handleRegenerate}
            onInsert={handleInsertContent}
          />
        )}
      </div>
    </div>
  );
};