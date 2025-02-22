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
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => {
          return element.style.backgroundColor;
        },
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }

          return {
            style: `background-color: ${attributes.color}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark',
        getAttrs: element => {
          if (typeof element === 'string') {
            return false;
          }
          return {
            color: element.style.backgroundColor,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setHighlight:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleHighlight:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
    };
  },
}); 