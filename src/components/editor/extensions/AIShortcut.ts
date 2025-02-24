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
          const tiptapEditor = editor as Editor;
          if (
            tiptapEditor.state.selection.content().size > 0 &&
            tiptapEditor.aiToolbar?.show
          ) {
            tiptapEditor.aiToolbar.show();
            return true;
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Alt-/': () => this.editor.commands.triggerAI(),
    };
  },
}); 