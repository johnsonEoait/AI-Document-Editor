import { Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { SelectionRange } from '../types/aiToolbar';

// 创建高亮插件的键
export const aiHighlightPluginKey = new PluginKey('aiHighlight');

/**
 * 创建AI文本高亮插件
 * @param editor 编辑器实例
 * @param selectionRef 选中范围的引用
 * @returns 注册和注销插件的函数
 */
export const createAIHighlightPlugin = (
  editor: Editor,
  selectionRef: React.MutableRefObject<SelectionRange | null>
) => {
  // 创建高亮插件
  const plugin = new Plugin({
    key: aiHighlightPluginKey,
    props: {
      decorations: (state) => {
        if (!selectionRef.current) return DecorationSet.empty;
        
        const { from, to } = selectionRef.current;
        return DecorationSet.create(state.doc, [
          Decoration.inline(from, to, {
            class: 'ai-processing-highlight',
          }),
        ]);
      },
    },
  });

  // 注册插件
  const registerPlugin = () => {
    editor.registerPlugin(plugin);
  };

  // 注销插件
  const unregisterPlugin = () => {
    editor.unregisterPlugin(aiHighlightPluginKey);
  };

  return {
    registerPlugin,
    unregisterPlugin
  };
}; 