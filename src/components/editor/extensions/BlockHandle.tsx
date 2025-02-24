import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Table, 
  Image, 
  List, 
  ListOrdered, 
  Code2, 
  Quote,
  GripVertical,
  AlignLeft,
  LucideIcon,
  LucideProps
} from 'lucide-react';
import { createElement, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import { NodeSelection } from '@tiptap/pm/state';

export interface BlockHandleOptions {
  HTMLAttributes: Record<string, any>;
}

interface CustomIconProps extends LucideProps {}

export const Heading4 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="m17 10-3 4h4" />
  </svg>
));

export const Heading5 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17 10h3" />
    <path d="M17 14c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 .9 2 2z" />
  </svg>
));

export const Heading6 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <circle cx="19" cy="14" r="2" />
    <path d="M20 10c-2 2-3 3.5-3 6" />
  </svg>
));

Heading4.displayName = 'Heading4';
Heading5.displayName = 'Heading5';
Heading6.displayName = 'Heading6';

interface DragState {
  isDragging: boolean;
  sourcePos: number | null;
  targetPos: number | null;
  sourceNode: ProseMirrorNode | null;
  dragElement: HTMLElement | null;
}

export const BlockHandle = Extension.create<BlockHandleOptions>({
  name: 'blockHandle',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addProseMirrorPlugins() {
    const dragState: DragState = {
      isDragging: false,
      sourcePos: null,
      targetPos: null,
      sourceNode: null,
      dragElement: null,
    };

    let activeBlock: HTMLElement | null = null;
    let blockHandle: HTMLElement | null = null;
    let typeIconRoot: ReturnType<typeof createRoot> | null = null;
    let dragIconRoot: ReturnType<typeof createRoot> | null = null;

    const getBlockTypeIcon = (element: HTMLElement): LucideIcon => {
      // 检查块类型
      if (element.matches('h1')) return Heading1;
      if (element.matches('h2')) return Heading2;
      if (element.matches('h3')) return Heading3;
      if (element.matches('h4')) return Heading4;
      if (element.matches('h5')) return Heading5;
      if (element.matches('h6')) return Heading6;
      if (element.matches('table')) return Table;
      if (element.matches('img, figure')) return Image;
      if (element.matches('ul')) return List;
      if (element.matches('ol')) return ListOrdered;
      if (element.matches('pre, code')) return Code2;
      if (element.matches('blockquote')) return Quote;
      // 默认段落图标
      return AlignLeft;
    };

    const renderTypeIcon = (container: Element, Icon: LucideIcon) => {
      if (typeIconRoot) {
        typeIconRoot.unmount();
      }
      typeIconRoot = createRoot(container);
      typeIconRoot.render(createElement(Icon, { 
        size: 20,
        className: 'text-gray-500'
      }));
    };

    const renderDragIcon = (container: Element) => {
      const dragIconContainer = document.createElement('div');
      dragIconContainer.className = 'flex items-center justify-center w-full h-full';
      container.appendChild(dragIconContainer);

      if (dragIconRoot) {
        dragIconRoot.unmount();
      }
      dragIconRoot = createRoot(dragIconContainer);
      dragIconRoot.render(createElement(GripVertical, { 
        size: 20,
        className: 'text-gray-500 group-hover:text-gray-700'
      }));
    };

    const findNodePosition = (view: EditorView, element: HTMLElement): number => {
      let pos = -1;
      const { doc } = view.state;

      doc.descendants((node, position) => {
        if (pos !== -1) return false;
        const dom = view.nodeDOM(position);
        if (dom && (dom === element || dom.contains(element))) {
          pos = position;
          return false;
        }
        return true;
      });

      return pos;
    };

    const handleDragStart = (view: EditorView, event: MouseEvent, block: HTMLElement) => {
      const pos = findNodePosition(view, block);
      if (pos === -1) return;

      const node = view.state.doc.nodeAt(pos);
      if (!node) return;

      dragState.isDragging = true;
      dragState.sourcePos = pos;
      dragState.sourceNode = node;
      dragState.dragElement = block;

      // 创建拖拽预览
      const ghost = block.cloneNode(true) as HTMLElement;
      ghost.classList.add('drag-ghost');
      ghost.style.position = 'fixed';
      ghost.style.top = `${event.clientY}px`;
      ghost.style.left = `${event.clientX}px`;
      ghost.style.width = `${block.offsetWidth}px`;
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);

      // 添加拖拽样式
      block.classList.add('dragging');
      view.dom.classList.add('dragging-active');
    };

    const handleDrag = (view: EditorView, event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.dragElement) return;

      const ghost = document.querySelector('.drag-ghost') as HTMLElement;
      if (ghost) {
        ghost.style.top = `${event.clientY}px`;
      }

      // 清除之前的目标指示器
      view.dom.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target', 'drop-target-before', 'drop-target-after');
      });

      // 查找目标位置
      const { doc } = view.state;
      let targetFound = false;

      doc.descendants((node, pos) => {
        if (targetFound || !node.isBlock) return false;

        const dom = view.nodeDOM(pos) as HTMLElement;
        if (!dom || dom === dragState.dragElement) return false;

        const rect = dom.getBoundingClientRect();
        if (event.clientY >= rect.top - 10 && event.clientY <= rect.bottom + 10) {
          targetFound = true;
          dragState.targetPos = pos;

          const isBefore = event.clientY < (rect.top + rect.bottom) / 2;
          dom.classList.add('drop-target');
          dom.classList.add(isBefore ? 'drop-target-before' : 'drop-target-after');
          return false;
        }
        return true;
      });

      // 处理拖动到文档末尾的情况
      if (!targetFound) {
        const lastNode = doc.lastChild;
        if (lastNode && lastNode.isBlock) {
          const lastDom = view.nodeDOM(doc.content.size - lastNode.nodeSize) as HTMLElement;
          if (lastDom && event.clientY > lastDom.getBoundingClientRect().bottom) {
            dragState.targetPos = doc.content.size;
            lastDom.classList.add('drop-target', 'drop-target-after');
          }
        }
      }
    };

    const handleDragEnd = (view: EditorView) => {
      if (!dragState.isDragging || dragState.sourcePos === null || dragState.targetPos === null) {
        cleanup();
        return;
      }

      const { state } = view;
      const { tr } = state;
      const sourcePos = dragState.sourcePos;
      let targetPos = dragState.targetPos;

      try {
        const isBefore = document.querySelector('.drop-target-before') !== null;
        const $from = state.doc.resolve(sourcePos);
        const range = $from.blockRange();

        if (range) {
          // 调整目标位置
          if (!isBefore && targetPos > sourcePos) {
            const targetNode = state.doc.nodeAt(targetPos);
            if (targetNode) {
              targetPos += targetNode.nodeSize;
            }
          }

          // 获取要移动的节点
          const node = state.doc.nodeAt(sourcePos);
          if (node) {
            // 创建一个新的事务
            const newTr = state.tr;

            // 如果节点在列表中，先提升它
            if (range.depth > 1) {
              const liftTarget = range.start - range.depth;
              newTr.lift(range, liftTarget);
            }

            // 获取节点的实际内容
            const slice = state.doc.slice(sourcePos, sourcePos + node.nodeSize);

            // 根据移动方向调整操作顺序
            if (targetPos > sourcePos) {
              // 向下移动：先删除原节点，再在新位置插入
              newTr.delete(sourcePos, sourcePos + node.nodeSize)
                  .insert(targetPos - node.nodeSize, slice.content);
            } else {
              // 向上移动：先在新位置插入，再删除原节点
              newTr.insert(targetPos, slice.content)
                  .delete(sourcePos + slice.content.size, sourcePos + node.nodeSize + slice.content.size);
            }

            // 设置选择范围到新位置
            const newPos = targetPos > sourcePos ? targetPos - node.nodeSize : targetPos;
            const $newPos = newTr.doc.resolve(newPos);
            newTr.setSelection(NodeSelection.create(newTr.doc, newPos));

            // 应用更改
            view.dispatch(newTr);
          }
        }
      } catch (error) {
        console.error('拖拽排序失败:', error);
      }

      cleanup();
    };

    const cleanup = () => {
      const ghost = document.querySelector('.drag-ghost');
      if (ghost) ghost.remove();

      document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target', 'drop-target-before', 'drop-target-after');
      });

      document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
      });

      if (dragState.dragElement) {
        dragState.dragElement.classList.remove('dragging');
      }

      document.querySelector('.dragging-active')?.classList.remove('dragging-active');

      dragState.isDragging = false;
      dragState.sourcePos = null;
      dragState.targetPos = null;
      dragState.sourceNode = null;
      dragState.dragElement = null;
    };

    const createBlockHandle = () => {
      if (!blockHandle) {
        blockHandle = document.createElement('div');
        blockHandle.className = 'block-handle opacity-0 transition-all duration-200';
        
        const handleContainer = document.createElement('div');
        handleContainer.className = 'absolute flex items-center gap-2 -translate-x-[84px] rounded hover:bg-gray-100 group py-1 px-1';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'flex items-center justify-center w-[24px] h-[24px] block-type-icon';
        
        const dragHandle = document.createElement('div');
        dragHandle.className = 'flex items-center justify-center w-[24px] h-[24px] cursor-move drag-handle';
        
        handleContainer.addEventListener('mousedown', (e) => {
          if (!activeBlock) return;
          
          e.preventDefault();
          const view = (window as any).view;
          if (view) {
            handleDragStart(view, e, activeBlock);
            
            const handleMouseMove = (e: MouseEvent) => {
              if (!dragState.isDragging) return;
              e.preventDefault();
              handleDrag(view, e);
            };
            
            const handleMouseUp = (e: MouseEvent) => {
              if (!dragState.isDragging) return;
              e.preventDefault();
              handleDragEnd(view);
              
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }
        });
        
        handleContainer.appendChild(iconContainer);
        handleContainer.appendChild(dragHandle);
        blockHandle.appendChild(handleContainer);

        renderDragIcon(dragHandle);
      }
      return blockHandle;
    };

    const updateBlockHandle = (view: any) => {
      if (!activeBlock || !blockHandle) return;

      const editorRect = view.dom.getBoundingClientRect();
      const blockRect = activeBlock.getBoundingClientRect();
      const editorContainer = view.dom.closest('.editor-container');
      
      if (!editorContainer) return;
      
      const containerRect = editorContainer.getBoundingClientRect();
      
      const top = blockRect.top - containerRect.top + 8;

      blockHandle.style.position = 'absolute';
      blockHandle.style.top = `${top}px`;
      blockHandle.style.left = '60px';
      blockHandle.style.opacity = '1';
      
      const iconContainer = blockHandle.querySelector('.block-type-icon');
      if (iconContainer) {
        const Icon = getBlockTypeIcon(activeBlock);
        renderTypeIcon(iconContainer, Icon);
      }

      // 重新渲染拖动图标
      const dragHandle = blockHandle.querySelector('.drag-handle');
      if (dragHandle) {
        dragHandle.innerHTML = '';
        renderDragIcon(dragHandle);
      }
      
      if (blockHandle.parentElement !== editorContainer) {
        editorContainer.appendChild(blockHandle);
      }
    };

    const findBlockElement = (target: HTMLElement): HTMLElement | null => {
      const tableElement = target.closest('table');
      if (tableElement) return tableElement as HTMLElement;
      const block = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, figure');
      return block as HTMLElement;
    };

    return [
      new Plugin({
        key: new PluginKey('blockHandle'),
        view: (view) => {
          (window as any).view = view;
          const blockHandle = createBlockHandle();
          
          const handleClick = (event: MouseEvent) => {
            if (dragState.isDragging) return;
            
            const target = event.target as HTMLElement;
            const block = findBlockElement(target);
            
            if (block) {
              if (activeBlock === block) return;
              
              if (activeBlock) {
                activeBlock.classList.remove('is-active');
              }
              
              activeBlock = block;
              block.classList.add('is-active');
              updateBlockHandle(view);
            } else if (activeBlock && blockHandle) {
              const handleRect = blockHandle.getBoundingClientRect();
              const isOverHandle = 
                event.clientX >= handleRect.left &&
                event.clientX <= handleRect.right &&
                event.clientY >= handleRect.top &&
                event.clientY <= handleRect.bottom;
              
              if (!isOverHandle) {
                activeBlock.classList.remove('is-active');
                activeBlock = null;
                blockHandle.style.opacity = '0';
              }
            }
          };

          const handleScroll = () => {
            if (activeBlock) {
              updateBlockHandle(view);
            }
          };

          view.dom.addEventListener('click', handleClick);
          window.addEventListener('scroll', handleScroll, true);

          return {
            destroy: () => {
              view.dom.removeEventListener('click', handleClick);
              window.removeEventListener('scroll', handleScroll, true);
              cleanup();
              blockHandle?.remove();
              delete (window as any).view;
            },
          };
        },
      }),
    ];
  },
}); 