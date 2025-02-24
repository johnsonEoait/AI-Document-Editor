import { Extension } from '@tiptap/core';
import { Editor } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiShortcut: {
      /**
       * 触发 AI 助手
       */
      triggerAI: () => ReturnType;
    };
  }
}

export const AIShortcut = Extension.create({
  name: 'aiShortcut',

  addCommands() {
    return {
      triggerAI:
        () =>
        ({ editor }) => {
          console.log('triggerAI command called');
          const tiptapEditor = editor as Editor;

          // 获取当前选中的内容
          const { state } = tiptapEditor;
          const { selection } = state;
          const { empty, ranges } = selection;

          // 如果没有选中内容，直接显示 AI 工具栏
          if (empty) {
            if (tiptapEditor.aiToolbar?.show) {
              console.log('No selection, showing AI toolbar for content generation');
              tiptapEditor.aiToolbar.show();
              return true;
            }
            return false;
          }

          // 检查选中内容是否有效
          const from = Math.min(...ranges.map((range) => range.$from.pos));
          const to = Math.max(...ranges.map((range) => range.$to.pos));
          
          if (from === to) {
            return false;
          }

          // 检查选中的节点类型
          const node = tiptapEditor.state.doc.nodeAt(from);
          if (node && (node.type.name === 'customImage' || node.type.name === 'table')) {
            return false;
          }

          // 显示 AI 工具栏
          if (tiptapEditor.aiToolbar?.show) {
            console.log('Selection exists, showing AI toolbar for text processing');
            tiptapEditor.aiToolbar.show();
            return true;
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Alt-/': ({ editor }) => {
        console.log('Alt-/ shortcut triggered');
        const result = editor.commands.triggerAI();
        console.log('Alt-/ shortcut result:', result);
        return true;
      },
    };
  },
});