import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { PMNode } from '@tiptap/pm';

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
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') || 
                       element.style.width || 
                       element.dataset.width;
          
          if (width) {
            const cleanWidth = width.toString().replace(/px|%|em|rem/g, '');
            const numericWidth = parseInt(cleanWidth, 10);
            console.log('解析HTML宽度:', { raw: width, parsed: numericWidth });
            return !isNaN(numericWidth) && numericWidth > 0 ? numericWidth : null;
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          
          // Ensure width is a number
          const width = Number(attributes.width);
          if (isNaN(width) || width <= 0) {
            return {};
          }
          
          console.log('渲染HTML宽度:', width);
          return {
            width: width,
            style: `width: ${width}px`,
            'data-width': width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height') || 
                        element.style.height || 
                        element.dataset.height;
          
          if (height) {
            const cleanHeight = height.toString().replace(/px|%|em|rem/g, '');
            const numericHeight = parseInt(cleanHeight, 10);
            console.log('解析HTML高度:', { raw: height, parsed: numericHeight });
            return !isNaN(numericHeight) && numericHeight > 0 ? numericHeight : null;
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          
          // Ensure height is a number
          const height = Number(attributes.height);
          if (isNaN(height) || height <= 0) {
            return {};
          }
          
          // Ensure width is a number if it exists
          let width = null;
          if (attributes.width) {
            width = Number(attributes.width);
            if (isNaN(width) || width <= 0) {
              width = null;
            }
          }
          
          console.log('渲染HTML高度:', { height, width });
          return {
            height: height,
            style: width 
              ? `height: ${height}px; width: ${width}px` 
              : `height: ${height}px`,
            'data-height': height,
          };
        },
      },
      _originalAspectRatio: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
      _currentAspectRatio: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },

  addStorage() {
    return {
      ...this.parent?.(),
      
      transformNodeAttributes: (node: any) => {
        if (!node || !node.attrs) return node;
        
        const attrs = { ...node.attrs };
        
        if (attrs.width !== undefined && attrs.width !== null) {
          const width = Number(attrs.width);
          attrs.width = !isNaN(width) && width > 0 ? width : null;
        }
        
        if (attrs.height !== undefined && attrs.height !== null) {
          const height = Number(attrs.height);
          attrs.height = !isNaN(height) && height > 0 ? height : null;
        }
        
        console.log('序列化图片属性:', {
          original: node.attrs,
          transformed: attrs
        });
        
        return {
          ...node,
          attrs
        };
      }
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.classList.add('image-resizable-container');
      container.style.display = 'inline-block';
      container.style.position = 'relative';
      container.style.lineHeight = '0';
      container.style.margin = '0.25em 0';
      container.style.padding = '0';
      container.style.fontSize = '0';
      container.style.userSelect = 'none';
      container.style.boxSizing = 'border-box';
      container.style.maxWidth = '100%';
      container.style.clear = 'both';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.title = node.attrs.title || '';
      img.className = 'max-w-full rounded-lg';
      img.style.display = 'block';
      img.style.margin = '0';
      img.style.padding = '0';
      img.style.verticalAlign = 'top';

      img.dataset.imageNode = 'true';
      
      // Store original aspect ratio when image loads
      let originalAspectRatio = 1;
      img.onload = () => {
        // Calculate and store the natural aspect ratio
        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;
        originalAspectRatio = naturalWidth / naturalHeight;
        
        console.log('图片加载完成:', {
          naturalWidth,
          naturalHeight,
          aspectRatio: originalAspectRatio,
          currentWidth: node.attrs.width,
          currentHeight: node.attrs.height
        });
        
        // Store the aspect ratio on the node for future reference
        if (typeof getPos === 'function') {
          const attrs = { ...node.attrs };
          
          // 设置原始宽高比
          attrs._originalAspectRatio = originalAspectRatio;
          
          // 如果没有设置宽高，使用自然尺寸
          if (!attrs.width && !attrs.height) {
            const newWidth = Math.min(naturalWidth, 800); // 限制最大宽度
            const newHeight = Math.round(newWidth / originalAspectRatio);
            
            attrs.width = newWidth;
            attrs.height = newHeight;
            attrs._currentAspectRatio = originalAspectRatio;
            
            console.log('设置初始尺寸:', { width: newWidth, height: newHeight });
          } 
          // 如果只有宽度，根据宽高比计算高度
          else if (attrs.width && !attrs.height) {
            attrs.height = Math.round(attrs.width / originalAspectRatio);
            attrs._currentAspectRatio = originalAspectRatio;
            console.log('根据宽度计算高度:', attrs.height);
          } 
          // 如果只有高度，根据宽高比计算宽度
          else if (!attrs.width && attrs.height) {
            attrs.width = Math.round(attrs.height * originalAspectRatio);
            attrs._currentAspectRatio = originalAspectRatio;
            console.log('根据高度计算宽度:', attrs.width);
          }
          // 如果宽高都有，但没有宽高比，设置宽高比
          else if (attrs.width && attrs.height && !attrs._currentAspectRatio) {
            attrs._currentAspectRatio = attrs.width / attrs.height;
            console.log('根据现有宽高设置宽高比:', attrs._currentAspectRatio);
          }
          
          // 更新节点属性
          editor.chain()
            .focus()
            .setNodeSelection(getPos())
            .updateAttributes('customImage', attrs)
            .run();
            
          console.log('保存图片属性:', attrs);
          
          // 应用尺寸到图片元素
          if (attrs.width) {
            img.style.width = `${attrs.width}px`;
            img.setAttribute('width', attrs.width.toString());
            img.dataset.width = attrs.width.toString();
          }
          
          if (attrs.height) {
            img.style.height = `${attrs.height}px`;
            img.setAttribute('height', attrs.height.toString());
            img.dataset.height = attrs.height.toString();
          }
          
          // 触发保存
          setTimeout(() => {
            try {
              const resizeCompleteEvent = new CustomEvent('image-resize-complete', {
                bubbles: true,
                detail: { 
                  width: attrs.width, 
                  height: attrs.height,
                  aspectRatio: attrs._currentAspectRatio,
                  source: 'image-load'
                }
              });
              console.log('触发图片加载完成事件', resizeCompleteEvent.detail);
              editor.view.dom.dispatchEvent(resizeCompleteEvent);
              
              // 强制保存
              setTimeout(() => {
                const forceSaveEvent = new Event('force-save-content');
                editor.view.dom.dispatchEvent(forceSaveEvent);
              }, 100);
            } catch (error) {
              console.error('触发图片加载事件失败:', error);
            }
          }, 100);
        }
      };

      const applyDimensions = () => {
        // Clear any existing dimensions first
        img.style.width = '';
        img.style.height = '';
        img.removeAttribute('width');
        img.removeAttribute('height');
        delete img.dataset.width;
        delete img.dataset.height;

        // Apply width if available
        if (node.attrs.width) {
          const width = Number(node.attrs.width);
          if (!isNaN(width) && width > 0) {
            img.style.width = `${width}px`;
            img.setAttribute('width', width.toString());
            img.dataset.width = width.toString();
            console.log('应用图片宽度:', width);
          }
        }

        // Apply height if available
        if (node.attrs.height) {
          const height = Number(node.attrs.height);
          if (!isNaN(height) && height > 0) {
            img.style.height = `${height}px`;
            img.setAttribute('height', height.toString());
            img.dataset.height = height.toString();
            console.log('应用图片高度:', height);
          }
        }

        // Force a reflow to ensure dimensions are applied
        void img.offsetWidth;
      };

      applyDimensions();

      const resizeHandles = ['nw', 'ne', 'se', 'sw'].map(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${position}`;
        
        handle.style.position = 'absolute';
        handle.style.width = '12px';
        handle.style.height = '12px';
        handle.style.backgroundColor = '#2563eb';
        handle.style.border = '2px solid white';
        handle.style.borderRadius = '50%';
        handle.style.zIndex = '10';
        handle.style.pointerEvents = 'all';
        handle.style.transform = 'translate(-50%, -50%)';
        handle.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.3)';
        
        switch (position) {
          case 'nw':
            handle.style.top = '0px';
            handle.style.left = '0px';
            handle.style.cursor = 'nw-resize';
            break;
          case 'ne':
            handle.style.top = '0px';
            handle.style.left = '100%';
            handle.style.cursor = 'ne-resize';
            break;
          case 'se':
            handle.style.top = '100%';
            handle.style.left = '100%';
            handle.style.cursor = 'se-resize';
            break;
          case 'sw':
            handle.style.top = '100%';
            handle.style.left = '0px';
            handle.style.cursor = 'sw-resize';
            break;
        }
        
        return handle;
      });

      const selectionFrame = document.createElement('div');
      selectionFrame.className = 'selection-frame';
      selectionFrame.style.position = 'absolute';
      selectionFrame.style.top = '0';
      selectionFrame.style.left = '0';
      selectionFrame.style.right = '0';
      selectionFrame.style.bottom = '0';
      selectionFrame.style.border = '2px solid #2563eb';
      selectionFrame.style.borderRadius = '4px';
      selectionFrame.style.pointerEvents = 'none';
      selectionFrame.style.zIndex = '1';
      selectionFrame.style.display = 'none';

      const updateSelection = () => {
        const selection = editor.state.selection;
        const nodePos = getPos?.();
        
        if (typeof nodePos === 'number') {
          const isSelected = selection.from <= nodePos && selection.to >= nodePos;
          container.classList.toggle('selected', isSelected);
          
          resizeHandles.forEach(handle => {
            handle.style.display = isSelected ? 'block' : 'none';
          });
          selectionFrame.style.display = isSelected ? 'block' : 'none';
        }
      };

      const selectNode = () => {
        const pos = getPos?.();
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos);
        }
      };

      container.addEventListener('click', (event) => {
        event.preventDefault();
        selectNode();
        updateSelection();
      });

      editor.on('selectionUpdate', updateSelection);

      resizeHandles.forEach((handle, index) => {
        handle.addEventListener('mousedown', (startEvent) => {
          startEvent.preventDefault();
          startEvent.stopPropagation();

          selectNode();
          
          const startX = startEvent.pageX;
          const startY = startEvent.pageY;
          const startWidth = img.offsetWidth;
          const startHeight = img.offsetHeight;
          const aspectRatio = startWidth / startHeight;
          const position = ['nw', 'ne', 'se', 'sw'][index];

          function onMouseMove(moveEvent: MouseEvent) {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            
            let deltaX = moveEvent.pageX - startX;
            let deltaY = moveEvent.pageY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            switch (position) {
              case 'nw':
                newWidth = startWidth - deltaX;
                newHeight = moveEvent.shiftKey ? newWidth / aspectRatio : startHeight - deltaY;
                break;
              case 'ne':
                newWidth = startWidth + deltaX;
                newHeight = moveEvent.shiftKey ? newWidth / aspectRatio : startHeight - deltaY;
                break;
              case 'se':
                newWidth = startWidth + deltaX;
                newHeight = moveEvent.shiftKey ? newWidth / aspectRatio : startHeight + deltaY;
                break;
              case 'sw':
                newWidth = startWidth - deltaX;
                newHeight = moveEvent.shiftKey ? newWidth / aspectRatio : startHeight + deltaY;
                break;
            }

            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);

            newWidth = Math.round(newWidth);
            newHeight = Math.round(newHeight);

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
            img.setAttribute('width', newWidth.toString());
            img.setAttribute('height', newHeight.toString());
            img.dataset.width = newWidth.toString();
            img.dataset.height = newHeight.toString();

            if (typeof getPos === 'function') {
              const attrs = {
                width: newWidth,
                height: newHeight,
              };
              
              // Store the current aspect ratio
              if (newHeight > 0) {
                attrs._currentAspectRatio = newWidth / newHeight;
              }
              
              editor.chain()
                .updateAttributes('customImage', attrs)
                .run();
            }
          }

          function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            
            if (typeof getPos === 'function') {
              const finalWidth = parseInt(img.getAttribute('width') || img.dataset.width || '0', 10) || 
                               Math.round(parseFloat(img.style.width) || img.offsetWidth);
              const finalHeight = parseInt(img.getAttribute('height') || img.dataset.height || '0', 10) || 
                                Math.round(parseFloat(img.style.height) || img.offsetHeight);
              
              if (finalWidth > 0 && finalHeight > 0) {
                const attrs = {
                  width: finalWidth,
                  height: finalHeight,
                  _currentAspectRatio: finalWidth / finalHeight
                };
                
                // Store the original aspect ratio if not already set
                if (!node.attrs._originalAspectRatio) {
                  attrs._originalAspectRatio = attrs._currentAspectRatio;
                } else {
                  attrs._originalAspectRatio = node.attrs._originalAspectRatio;
                }
                
                console.log('图片调整完成，更新尺寸:', attrs);
                
                // First update the node attributes
                editor.chain()
                  .focus()
                  .setNodeSelection(getPos())
                  .updateAttributes('customImage', attrs)
                  .run();
                
                // Force state update
                editor.view.updateState(editor.view.state);
                
                console.log('图片尺寸已更新', { 
                  width: finalWidth, 
                  height: finalHeight,
                  aspectRatio: attrs._currentAspectRatio
                });
                
                // Dispatch a custom event to trigger immediate save
                setTimeout(() => {
                  try {
                    // Double check that the attributes were actually updated
                    const updatedNode = editor.state.doc.nodeAt(getPos());
                    console.log('更新后的节点属性:', updatedNode?.attrs);
                    
                    // Create and dispatch the event
                    const resizeCompleteEvent = new CustomEvent('image-resize-complete', {
                      bubbles: true,
                      detail: { 
                        width: finalWidth, 
                        height: finalHeight,
                        aspectRatio: attrs._currentAspectRatio,
                        nodePos: getPos()
                      }
                    });
                    
                    console.log('触发图片调整完成事件', resizeCompleteEvent.detail);
                    editor.view.dom.dispatchEvent(resizeCompleteEvent);
                    
                    // Double check the content after resize
                    setTimeout(() => {
                      console.log('调整后的编辑器内容:', editor.getJSON());
                      
                      // Force another save to ensure it's saved
                      const event = new Event('force-save-content');
                      editor.view.dom.dispatchEvent(event);
                    }, 100);
                  } catch (error) {
                    console.error('触发保存事件失败:', error);
                  }
                }, 50);
              }
            }
          }

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        });
      });

      container.append(img);
      container.append(selectionFrame);
      resizeHandles.forEach(handle => container.append(handle));

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src;
          }
          
          if (updatedNode.attrs.alt !== node.attrs.alt) {
            img.alt = updatedNode.attrs.alt || '';
          }
          if (updatedNode.attrs.title !== node.attrs.title) {
            img.title = updatedNode.attrs.title || '';
          }
          
          const widthChanged = updatedNode.attrs.width !== node.attrs.width;
          const heightChanged = updatedNode.attrs.height !== node.attrs.height;
          
          if (widthChanged || heightChanged) {
            console.log('图片尺寸更新:', {
              old: { width: node.attrs.width, height: node.attrs.height },
              new: { width: updatedNode.attrs.width, height: updatedNode.attrs.height }
            });
          }
          
          // Update the node reference with the new node
          Object.assign(node, updatedNode);
          
          // Apply dimensions to ensure they're correctly set
          applyDimensions();
          
          // Update selection state
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
    const attrs = { ...HTMLAttributes };
    
    // Ensure width and height are applied directly to the HTML attributes
    let style = attrs.style || '';
    
    if (attrs.width && !isNaN(Number(attrs.width))) {
      const width = Number(attrs.width);
      if (width > 0) {
        if (!style.includes('width:')) {
          style += `width: ${width}px; `;
        }
        attrs.width = width;
        attrs['data-width'] = width;
      }
    }
    
    if (attrs.height && !isNaN(Number(attrs.height))) {
      const height = Number(attrs.height);
      if (height > 0) {
        if (!style.includes('height:')) {
          style += `height: ${height}px; `;
        }
        attrs.height = height;
        attrs['data-height'] = height;
      }
    }
    
    if (style) {
      attrs.style = style.trim();
    }
    
    console.log('渲染HTML图片属性:', attrs);
    
    return ['img', mergeAttributes(attrs)];
  },

  applyDimensions(img: HTMLImageElement) {
    // 清除现有尺寸
    img.style.width = '';
    img.style.height = '';
    
    // 获取节点属性
    const width = this.options.width;
    const height = this.options.height;
    const originalAspectRatio = this.options._originalAspectRatio;
    
    console.log('应用图片尺寸:', {
      width,
      height,
      originalAspectRatio,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
    
    // 如果没有保存的尺寸，使用图片的自然尺寸
    if (!width && !height) {
      // 等待图片加载完成后设置初始尺寸
      if (!img.complete) {
        img.onload = () => {
          // 计算并存储原始宽高比
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          
          // 更新节点属性
          this.updateAttributes({
            width: img.naturalWidth,
            height: img.naturalHeight,
            _originalAspectRatio: aspectRatio,
            _currentAspectRatio: aspectRatio
          });
          
          console.log('图片加载完成，设置初始尺寸:', {
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio
          });
        };
      } else {
        // 图片已加载，直接设置
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        this.updateAttributes({
          width: img.naturalWidth,
          height: img.naturalHeight,
          _originalAspectRatio: aspectRatio,
          _currentAspectRatio: aspectRatio
        });
      }
      return;
    }
    
    // 应用保存的尺寸
    if (typeof width === 'number' && !isNaN(width)) {
      img.style.width = `${width}px`;
    }
    
    if (typeof height === 'number' && !isNaN(height)) {
      img.style.height = `${height}px`;
    }
    
    // 如果只有一个维度有效，使用原始宽高比计算另一个维度
    if (typeof width === 'number' && !isNaN(width) && (!height || isNaN(Number(height))) && originalAspectRatio) {
      const calculatedHeight = width / originalAspectRatio;
      img.style.height = `${calculatedHeight}px`;
      
      // 更新节点属性
      this.updateAttributes({
        height: calculatedHeight,
        _currentAspectRatio: originalAspectRatio
      });
      
      console.log('根据宽度和原始宽高比计算高度:', {
        width,
        calculatedHeight,
        originalAspectRatio
      });
    } else if (typeof height === 'number' && !isNaN(height) && (!width || isNaN(Number(width))) && originalAspectRatio) {
      const calculatedWidth = height * originalAspectRatio;
      img.style.width = `${calculatedWidth}px`;
      
      // 更新节点属性
      this.updateAttributes({
        width: calculatedWidth,
        _currentAspectRatio: originalAspectRatio
      });
      
      console.log('根据高度和原始宽高比计算宽度:', {
        height,
        calculatedWidth,
        originalAspectRatio
      });
    }
    
    // 强制重新计算布局
    void img.offsetWidth;
  },

  update(node: PMNode) {
    // 更新节点属性
    this.options = {
      ...this.options,
      ...node.attrs,
    };

    // 获取图片元素
    const img = this.dom.querySelector('img');
    if (!img) return;

    // 更新图片源
    if (this.options.src && this.options.src !== img.getAttribute('src')) {
      img.setAttribute('src', this.options.src);
    }

    // 记录更新前的尺寸
    console.log('更新前的图片尺寸:', {
      width: img.style.width,
      height: img.style.height,
      nodeWidth: this.options.width,
      nodeHeight: this.options.height,
      originalAspectRatio: this.options._originalAspectRatio,
      currentAspectRatio: this.options._currentAspectRatio
    });

    // 应用尺寸
    this.applyDimensions(img);

    // 记录更新后的尺寸
    console.log('更新后的图片尺寸:', {
      width: img.style.width,
      height: img.style.height,
      nodeWidth: this.options.width,
      nodeHeight: this.options.height
    });

    // 更新选择状态
    this.updateSelection();
  }
}); 