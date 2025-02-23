import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface BlockHandleOptions {
  HTMLAttributes: Record<string, any>;
}

export const BlockHandle = Extension.create<BlockHandleOptions>({
  name: 'blockHandle',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addProseMirrorPlugins() {
    let hoveredBlock: HTMLElement | null = null;
    let blockHandle: HTMLElement | null = null;

    const createBlockHandle = () => {
      if (!blockHandle) {
        blockHandle = document.createElement('div');
        blockHandle.className = 'block-handle opacity-0 transition-all duration-200';
        blockHandle.innerHTML = `
          <div class="absolute flex items-center justify-center w-[18px] h-[18px] -translate-x-[44px] rounded hover:bg-gray-100 cursor-move group">
            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6C9 7.10457 8.10457 8 7 8C5.89543 8 5 7.10457 5 6C5 4.89543 5.89543 4 7 4C8.10457 4 9 4.89543 9 6Z" fill="currentColor"/>
              <path d="M9 12C9 13.1046 8.10457 14 7 14C5.89543 14 5 13.1046 5 12C5 10.8954 5.89543 10 7 10C8.10457 10 9 10.8954 9 12Z" fill="currentColor"/>
              <path d="M9 18C9 19.1046 8.10457 20 7 20C5.89543 20 5 19.1046 5 18C5 16.8954 5.89543 16 7 16C8.10457 16 9 16.8954 9 18Z" fill="currentColor"/>
              <path d="M19 6C19 7.10457 18.1046 8 17 8C15.8954 8 15 7.10457 15 6C15 4.89543 15.8954 4 17 4C18.1046 4 19 4.89543 19 6Z" fill="currentColor"/>
              <path d="M19 12C19 13.1046 18.1046 14 17 14C15.8954 14 15 13.1046 15 12C15 10.8954 15.8954 10 17 10C18.1046 10 19 10.8954 19 12Z" fill="currentColor"/>
              <path d="M19 18C19 19.1046 18.1046 20 17 20C15.8954 20 15 19.1046 15 18C15 16.8954 15.8954 16 17 16C18.1046 16 19 16.8954 19 18Z" fill="currentColor"/>
            </svg>
          </div>
        `;
      }
      return blockHandle;
    };

    const updateBlockHandle = (view: any) => {
      if (!hoveredBlock || !blockHandle) return;

      const editorRect = view.dom.getBoundingClientRect();
      const blockRect = hoveredBlock.getBoundingClientRect();
      const editorContainer = view.dom.closest('.editor-container');
      
      if (!editorContainer) return;
      
      const containerRect = editorContainer.getBoundingClientRect();
      
      // 计算相对于编辑器容器的位置，现在对齐到块的顶部
      const top = blockRect.top - containerRect.top + 4;

      // 更新句柄位置
      blockHandle.style.position = 'absolute';
      blockHandle.style.top = `${top}px`;
      blockHandle.style.left = '60px';
      blockHandle.style.opacity = '1';
      
      // 将句柄添加到编辑器容器中
      if (blockHandle.parentElement !== editorContainer) {
        editorContainer.appendChild(blockHandle);
      }
    };

    const findBlockElement = (target: HTMLElement): HTMLElement | null => {
      // 首先检查是否在表格内
      const tableElement = target.closest('table');
      if (tableElement) {
        return tableElement;
      }

      // 如果不在表格内，则检查其他块级元素
      const blockElement = target.closest('p, h1, h2, h3, ul, ol, blockquote, pre');
      return blockElement;
    };

    return [
      new Plugin({
        key: new PluginKey('blockHandle'),
        view: (view) => {
          const blockHandle = createBlockHandle();

          const handleMouseMove = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const block = findBlockElement(target);
            
            if (block && block !== hoveredBlock) {
              hoveredBlock = block;
              updateBlockHandle(view);
            } else if (!block && hoveredBlock && blockHandle) {
              // 只有当鼠标不在句柄上时才隐藏
              const handleRect = blockHandle.getBoundingClientRect();
              const isOverHandle = 
                event.clientX >= handleRect.left &&
                event.clientX <= handleRect.right &&
                event.clientY >= handleRect.top &&
                event.clientY <= handleRect.bottom;
              
              if (!isOverHandle) {
                hoveredBlock = null;
                blockHandle.style.opacity = '0';
              }
            }
          };

          const handleScroll = () => {
            if (hoveredBlock) {
              updateBlockHandle(view);
            }
          };

          view.dom.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('scroll', handleScroll);

          return {
            destroy: () => {
              view.dom.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('scroll', handleScroll);
              blockHandle?.remove();
            },
          };
        },
      }),
    ];
  },
}); 