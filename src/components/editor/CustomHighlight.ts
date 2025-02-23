import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: (attributes: { color: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
      toggleHighlight: (attributes: { color: string }) => ReturnType;
    };
  }
}

export const CustomHighlight = Extension.create({
  name: 'highlight',

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) {
                return {};
              }
              return {
                style: `background-color: ${attributes.backgroundColor}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setHighlight:
        attributes =>
        ({ chain }) => {
          return chain().setMark('textStyle', { backgroundColor: attributes.color }).run();
        },
      unsetHighlight:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { backgroundColor: null }).run();
        },
      toggleHighlight:
        attributes =>
        ({ commands }) => {
          const { backgroundColor } = this.editor.getAttributes('textStyle');
          if (backgroundColor === attributes.color) {
            return commands.unsetHighlight();
          }
          return commands.setHighlight(attributes);
        },
    };
  },
}); 