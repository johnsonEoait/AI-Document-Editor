import React, { useState, useEffect } from 'react';
import { TableOfContentsItem } from './types/editor';
import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';

interface TableOfContentsProps {
  isVisible: boolean;
  onClose: () => void;
  tableOfContents: TableOfContentsItem[];
  editor: Editor | null;
  setIsVisible: (isVisible: boolean) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  isVisible, 
  onClose, 
  tableOfContents, 
  editor,
  setIsVisible
}) => {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  
  // 当目录关闭时，清除活动标题状态
  useEffect(() => {
    if (!isVisible) {
      setActiveHeading(null);
    }
  }, [isVisible]);

  // 监听编辑器内容变化，检测标题并自动打开或关闭目录
  useEffect(() => {
    if (!editor) return;

    // 检查是否有标题并自动打开或关闭目录
    const checkForHeadings = () => {
      if (tableOfContents.length > 0 && !isVisible) {
        // 有标题但目录未显示，打开目录
        setIsVisible(true);
      } else if (tableOfContents.length === 0 && isVisible) {
        // 没有标题但目录显示中，关闭目录
        setIsVisible(false);
      }
    };

    // 立即执行初始检查
    checkForHeadings();

    // 监听编辑器内容变化
    const onUpdate = () => {
      checkForHeadings();
    };

    // 添加事件监听器
    editor.on('update', onUpdate);

    // 清理函数
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor, tableOfContents, isVisible, setIsVisible]);

  // 添加一个单独的 useEffect 用于初始页面加载时检测标题
  useEffect(() => {
    // 确保在组件挂载后立即检查标题
    if (tableOfContents.length > 0 && !isVisible) {
      // 有标题但目录未显示，打开目录
      setIsVisible(true);
    } else if (tableOfContents.length === 0 && isVisible) {
      // 没有标题但目录显示中，关闭目录
      setIsVisible(false);
    }
  }, [tableOfContents, isVisible, setIsVisible]);

  if (!editor) return null;

  // 自定义滚动函数，使标题位于屏幕中央
  const scrollToCenter = (element: HTMLElement) => {
    if (!element) return;
    
    // 获取元素的位置信息
    const rect = element.getBoundingClientRect();
    
    // 计算元素应该滚动到的位置（居中）
    const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    
    // 平滑滚动
    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
    
    // 添加更醒目的高亮效果
    applyHighlightEffect(element);
  };

  // 应用高亮动画效果 - 使用更可靠的方法
  const applyHighlightEffect = (element: HTMLElement) => {
    // 创建一个覆盖元素来实现高亮效果
    const overlay = document.createElement('div');
    
    // 获取元素的位置和尺寸
    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    // 设置覆盖元素的样式
    overlay.style.position = 'absolute';
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top + scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.backgroundColor = 'rgba(255, 235, 59, 0.5)'; // 半透明黄色
    overlay.style.borderRadius = '4px';
    overlay.style.pointerEvents = 'none'; // 确保不会阻止点击
    overlay.style.zIndex = '9999';
    overlay.style.boxShadow = '0 0 15px 5px rgba(255, 235, 59, 0.7)';
    overlay.style.transition = 'all 0.3s ease-in-out';
    overlay.style.animation = 'pulse-highlight 2s ease-in-out';
    
    // 添加动画关键帧
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-highlight {
        0% { opacity: 0; transform: scale(0.95); }
        20% { opacity: 1; transform: scale(1.05); }
        40% { opacity: 0.8; transform: scale(1); }
        60% { opacity: 1; transform: scale(1.03); }
        80% { opacity: 0.8; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.98); }
      }
    `;
    document.head.appendChild(style);
    
    // 将覆盖元素添加到文档中
    document.body.appendChild(overlay);
    
    // 在动画结束后移除覆盖元素和样式
    setTimeout(() => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    }, 2000);
    
    // 同时，也给元素本身添加一个临时的高亮类
    element.classList.add('toc-highlight');
    
    // 添加临时样式
    const elementStyle = document.createElement('style');
    elementStyle.textContent = `
      .toc-highlight {
        background-color: #fff9c4 !important;
        transition: background-color 2s ease-in-out !important;
      }
    `;
    document.head.appendChild(elementStyle);
    
    // 移除高亮类和样式
    setTimeout(() => {
      element.classList.remove('toc-highlight');
      document.head.removeChild(elementStyle);
    }, 2000);
  };

  const handleHeadingClick = (heading: TableOfContentsItem, index: number) => {
    // 设置当前活动标题
    setActiveHeading(heading.text);
    
    // 简单直接的方法：遍历文档中的所有节点，找到匹配的标题
    let headingFound = false;
    
    // 方法1：使用 TipTap 的 API 查找标题位置
    const { state } = editor;
    let headingPos = 0;
    
    state.doc.forEach((node, offset) => {
      if (headingFound) return;
      
      if (node.type.name === 'heading' && 
          node.attrs.level === heading.level && 
          node.textContent === heading.text) {
        headingPos = offset;
        headingFound = true;
      }
    });
    
    if (headingFound) {
      // 设置选择
      editor.commands.setTextSelection(headingPos);
      
      // 方法2：使用 DOM API 查找并滚动到标题
      setTimeout(() => {
        try {
          // 查找所有标题元素
          const editorElement = document.querySelector('.ProseMirror');
          if (!editorElement) return;
          
          const headingSelector = `h${heading.level}`;
          const headingElements = editorElement.querySelectorAll(headingSelector);
          
          // 查找匹配文本的标题
          for (let i = 0; i < headingElements.length; i++) {
            const element = headingElements[i] as HTMLElement;
            if (element.textContent === heading.text) {
              // 使用自定义滚动函数，使标题居中
              scrollToCenter(element);
              break;
            }
          }
        } catch (error) {
          console.error('DOM 滚动方法失败:', error);
          
          // 方法3：使用更直接的 DOM 操作
          try {
            // 尝试使用 ID 选择器（如果编辑器为标题生成了 ID）
            const headingId = `heading-${heading.level}-${heading.text.toLowerCase().replace(/\s+/g, '-')}`;
            const headingElement = document.getElementById(headingId);
            
            if (headingElement) {
              scrollToCenter(headingElement as HTMLElement);
            } else {
              // 方法4：使用 TipTap 的 coordsAtPos 方法获取位置
              try {
                const view = editor.view;
                const pos = headingPos + 1; // 标题节点的开始位置
                const coords = view.coordsAtPos(pos);
                
                // 使用坐标滚动到中央位置
                window.scrollTo({
                  top: coords.top + window.scrollY - (window.innerHeight / 2),
                  behavior: 'smooth'
                });
                
                // 尝试找到 DOM 节点并高亮
                const domAtPos = view.domAtPos(pos);
                if (domAtPos && domAtPos.node) {
                  let node: Node | null = domAtPos.node;
                  // 查找最近的标题元素
                  while (node && node.nodeType !== Node.ELEMENT_NODE) {
                    if (node.parentNode) {
                      node = node.parentNode;
                    } else {
                      node = null;
                      break;
                    }
                  }
                  
                  if (node && node instanceof HTMLElement) {
                    // 应用高亮效果
                    applyHighlightEffect(node);
                  }
                }
              } catch (coordError) {
                console.error('坐标定位失败:', coordError);
                
                // 备用方法：使用 window.scrollTo
                const editorContainer = document.querySelector('.editor-content');
                if (editorContainer) {
                  const containerRect = editorContainer.getBoundingClientRect();
                  window.scrollTo({
                    top: window.scrollY + containerRect.top - (window.innerHeight / 2) + 100,
                    behavior: 'smooth'
                  });
                }
              }
            }
          } catch (e) {
            console.error('备用滚动方法也失败:', e);
          }
        }
      }, 100); // 增加延迟，确保 DOM 已更新
    }
    
    // 添加高亮效果，然后在一段时间后移除
    setTimeout(() => {
      setActiveHeading(null);
    }, 2500); // 延长时间以匹配高亮动画
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed"
          style={{ 
            left: 'max(24px, calc((100vw - 1280px - 640px) / 2))', 
            top: '140px', 
            width: '280px',
            maxWidth: 'calc((100vw - 1280px) / 2 - 24px)',
            zIndex: 50
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div 
            className="bg-white rounded-lg border border-gray-200 shadow-sm"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">目录</div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="关闭目录"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-1 py-2">
              <div className="space-y-0.5 max-h-[calc(100vh-240px)] overflow-y-auto">
                {tableOfContents.map((heading, index) => (
                  <motion.div
                    key={index}
                    className={`group relative cursor-pointer text-[13px] leading-6 hover:bg-gray-100 rounded-md transition-colors ${activeHeading === heading.text ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    style={{ 
                      paddingLeft: `${(heading.level - 1) * 1.25 + 0.75}rem`,
                      paddingRight: '0.75rem',
                      fontSize: `${heading.level === 1 ? '1em' : heading.level === 2 ? '0.95em' : '0.9em'}`,
                      fontWeight: heading.level <= 3 ? 500 : 400
                    }}
                    onClick={() => handleHeadingClick(heading, index)}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center py-1 gap-1.5">
                      <span className="truncate flex-1">{heading.text}</span>
                      <motion.span 
                        className={`${activeHeading === heading.text ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity text-gray-400`}
                        animate={{ x: activeHeading === heading.text ? [0, 5, 0] : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.span>
                    </div>
                  </motion.div>
                ))}
                {tableOfContents.length === 0 && (
                  <motion.div 
                    className="px-4 py-3 text-sm text-gray-500 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    暂无目录内容
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 