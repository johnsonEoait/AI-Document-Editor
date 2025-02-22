import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const CustomImage = Image.extend({
  name: 'customImage',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: true,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.classList.add('image-resizable-container');

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.className = 'max-w-full h-auto rounded-lg';

      if (node.attrs.width) {
        img.style.width = node.attrs.width + 'px';
      }
      if (node.attrs.height) {
        img.style.height = node.attrs.height + 'px';
      }

      // 创建调整大小的控制点
      const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${position}`;
        return handle;
      });

      // 添加选中效果
      const selectionFrame = document.createElement('div');
      selectionFrame.className = 'selection-frame';

      // 更新选中状态
      const updateSelection = () => {
        const selection = editor.state.selection;
        const nodePos = getPos?.();
        
        if (typeof nodePos === 'number') {
          const isSelected = selection.from <= nodePos && selection.to >= nodePos;
          container.classList.toggle('selected', isSelected);
        }
      };

      // 选中图片
      const selectNode = () => {
        const pos = getPos?.();
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos);
        }
      };

      // 处理点击事件
      container.addEventListener('mousedown', (event) => {
        if (event.target === img) {
          event.preventDefault();
          selectNode();
        }
      });

      // 监听选区变化
      editor.on('selectionUpdate', updateSelection);

      // 处理拖拽调整大小
      resizeHandles.forEach((handle, index) => {
        handle.addEventListener('mousedown', (startEvent) => {
          startEvent.preventDefault();
          startEvent.stopPropagation();

          selectNode();
          
          const startX = startEvent.pageX;
          const startY = startEvent.pageY;
          const startWidth = img.offsetWidth;
          const startHeight = img.offsetHeight;
          
          const position = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'][index];
          const aspectRatio = startWidth / startHeight;

          function onMouseMove(moveEvent: MouseEvent) {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            
            let deltaX = moveEvent.pageX - startX;
            let deltaY = moveEvent.pageY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            // 根据不同的控制点位置计算新的尺寸
            switch (position) {
              case 'e':
              case 'w':
                newWidth = position === 'e' ? startWidth + deltaX : startWidth - deltaX;
                newHeight = newWidth / aspectRatio;
                break;
              case 'n':
              case 's':
                newHeight = position === 's' ? startHeight + deltaY : startHeight - deltaY;
                newWidth = newHeight * aspectRatio;
                break;
              case 'nw':
              case 'se':
                newWidth = position === 'se' ? startWidth + deltaX : startWidth - deltaX;
                newHeight = newWidth / aspectRatio;
                break;
              case 'ne':
              case 'sw':
                newWidth = position === 'ne' ? startWidth + deltaX : startWidth - deltaX;
                newHeight = newWidth / aspectRatio;
                break;
            }

            // 限制最小尺寸
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);

            // 立即更新图片尺寸以获得实时预览
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;

            // 更新节点属性
            if (typeof getPos === 'function') {
              editor.chain()
                .updateAttributes(this.name, {
                  width: Math.round(newWidth),
                  height: Math.round(newHeight),
                })
                .run();
            }
          }

          function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          }

          // 使用 window 作为事件监听对象，这样即使鼠标移出控制点也能继续响应
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        });
      });

      // 组装DOM
      container.append(img, selectionFrame, ...resizeHandles);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src;
          }
          if (updatedNode.attrs.width) {
            img.style.width = updatedNode.attrs.width + 'px';
          }
          if (updatedNode.attrs.height) {
            img.style.height = updatedNode.attrs.height + 'px';
          }
          updateSelection();
          return true;
        },
        destroy: () => {
          editor.off('selectionUpdate', updateSelection);
        },
      };
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'image-resizable-container' }, ['img', mergeAttributes(HTMLAttributes)]];
  },
}); 