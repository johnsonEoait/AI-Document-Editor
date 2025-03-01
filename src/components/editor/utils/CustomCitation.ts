import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Set a citation with source information
       */
      setCitation: (attributes: { source: string, author?: string }) => ReturnType;
    };
  }
}

export const CustomCitation = Extension.create({
  name: 'citation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setCitation: (attributes) => ({ commands, chain, state }) => {
        // First create a blockquote
        const result = chain().focus().toggleBlockquote().run();
        
        if (!result) return false;
        
        // If we have source information, add it as a paragraph
        if (attributes.source) {
          const sourceText = attributes.author 
            ? `${attributes.author}, ${attributes.source}` 
            : attributes.source;
          
          // Insert a new paragraph at the end of the blockquote for the source
          setTimeout(() => {
            chain()
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  // Find the end of the blockquote
                  const { doc, selection } = state;
                  const blockquotePos = selection.$from.before(1);
                  const blockquote = doc.nodeAt(blockquotePos);
                  
                  if (blockquote) {
                    // Create a new paragraph node for the source
                    const sourceNode = state.schema.nodes.paragraph.create(
                      null,
                      state.schema.text(sourceText)
                    );
                    
                    // Insert the source node at the end of the blockquote
                    tr.insert(blockquotePos + blockquote.nodeSize - 1, sourceNode);
                    dispatch(tr);
                  }
                }
                return true;
              })
              .run();
          }, 10);
        }
        
        return true;
      },
    };
  },
}); 