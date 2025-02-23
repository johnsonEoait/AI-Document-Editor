import { Editor } from '@tiptap/react';
import { Search } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const searchHighlightPluginKey = new PluginKey('search-highlight');

interface FindReplaceProps {
  editor: Editor;
}

export const FindReplace = ({ editor }: FindReplaceProps) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(-1);

  // 创建并注册搜索高亮插件
  useEffect(() => {
    if (!editor) return;

    const plugin = new Plugin({
      key: searchHighlightPluginKey,
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, old) {
          // 如果事务包含搜索高亮的元数据，使用新的装饰集
          const searchHighlight = tr.getMeta(searchHighlightPluginKey);
          if (searchHighlight !== undefined) {
            return searchHighlight;
          }
          
          // 否则，调整现有装饰的位置
          return tr.docChanged ? old.map(tr.mapping, tr.doc) : old;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(searchHighlightPluginKey);
    };
  }, [editor]);

  const findMatches = useCallback((searchText: string) => {
    if (!editor || !searchText) {
      // 清除所有高亮
      editor.view.dispatch(
        editor.view.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty)
      );
      setMatches([]);
      setCurrentMatch(-1);
      return;
    }

    try {
      const { doc } = editor.state;
      const positions: number[] = [];
      let pos = 0;

      // 查找所有匹配位置
      doc.nodesBetween(0, doc.content.size, (node, nodePos) => {
        if (node.isText) {
          const text = node.text || '';
          let index = text.indexOf(searchText);
          
          while (index !== -1) {
            positions.push(nodePos + index);
            index = text.indexOf(searchText, index + 1);
          }
        }
        return true;
      });

      setMatches(positions);
      
      if (positions.length > 0) {
        setCurrentMatch(0);
        
        // 创建高亮装饰
        const decorations = positions.map((pos, index) => 
          Decoration.inline(pos, pos + searchText.length, {
            class: index === 0 ? 'search-highlight-current' : 'search-highlight'
          })
        );

        // 应用高亮
        const decorationSet = DecorationSet.create(doc, decorations);
        editor.view.dispatch(
          editor.view.state.tr.setMeta(searchHighlightPluginKey, decorationSet)
        );

        // 滚动到第一个匹配项
        setTimeout(() => {
          const dom = editor.view.domAtPos(positions[0]);
          if (dom.node) {
            (dom.node as Element).scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 0);
      } else {
        setCurrentMatch(-1);
        // 清除所有高亮
        editor.view.dispatch(
          editor.view.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty)
        );
      }
    } catch (error) {
      console.error('查找出错:', error);
      setMatches([]);
      setCurrentMatch(-1);
      editor.view.dispatch(
        editor.view.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty)
      );
    }
  }, [editor]);

  // 监听输入变化
  useEffect(() => {
    findMatches(findText);
  }, [findText, findMatches]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    let newMatch;
    if (direction === 'next') {
      newMatch = (currentMatch + 1) % matches.length;
    } else {
      newMatch = (currentMatch - 1 + matches.length) % matches.length;
    }

    setCurrentMatch(newMatch);

    try {
      // 更新高亮
      const decorations = matches.map((pos, index) => 
        Decoration.inline(pos, pos + findText.length, {
          class: index === newMatch ? 'search-highlight-current' : 'search-highlight'
        })
      );

      const decorationSet = DecorationSet.create(editor.state.doc, decorations);
      editor.view.dispatch(
        editor.view.state.tr.setMeta(searchHighlightPluginKey, decorationSet)
      );

      // 滚动到当前匹配项
      const dom = editor.view.domAtPos(matches[newMatch]);
      if (dom.node) {
        (dom.node as Element).scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    } catch (error) {
      console.error('导航出错:', error);
    }
  };

  const replaceMatch = () => {
    if (currentMatch === -1 || !findText) return;

    try {
      const from = matches[currentMatch];
      const to = from + findText.length;
      
      // 使用 replaceWith 命令替换文本，这样可以保持位置不变
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from, to },
          replaceText
        )
        .run();

      // 更新匹配列表
      findMatches(findText);
    } catch (error) {
      console.error('替换出错:', error);
    }
  };

  const replaceAll = () => {
    if (matches.length === 0 || !findText) return;

    try {
      // 从后向前替换，这样不会影响前面匹配项的位置
      [...matches].reverse().forEach((pos) => {
        editor
          .chain()
          .focus()
          .insertContentAt(
            { from: pos, to: pos + findText.length },
            replaceText
          )
          .run();
      });

      // 清除匹配列表和高亮
      setMatches([]);
      setCurrentMatch(-1);
      editor.view.dispatch(
        editor.view.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty)
      );
    } catch (error) {
      console.error('全部替换出错:', error);
    }
  };

  return (
    <Popover.Root modal>
      <Popover.Trigger asChild>
        <button
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="查找和替换"
        >
          <Search className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg p-4 w-[320px] border border-gray-200"
          sideOffset={5}
          onInteractOutside={(e) => {
            // 如果点击的是编辑器区域，阻止关闭
            if (editor.view.dom.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={() => {
            // 当按ESC关闭弹窗时，清除所有高亮
            editor.view.dispatch(
              editor.view.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty)
            );
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-medium text-gray-900">查找</div>
              <div className="text-sm text-gray-500 ml-auto">
                {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : '无匹配'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="输入要查找的文本..."
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 text-base"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => navigateMatch('prev')}
                  disabled={matches.length === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  title="上一个"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateMatch('next')}
                  disabled={matches.length === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  title="下一个"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 mt-3">
                <div className="text-sm font-medium text-gray-900">替换</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="输入要替换的文本..."
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 text-base"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={replaceMatch}
                  disabled={currentMatch === -1}
                  className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-black text-white cursor-pointer hover:bg-white hover:text-black border border-black transition-colors" 
                >
                  替换当前
                </button>
                <button
                  onClick={replaceAll}
                  disabled={matches.length === 0}
                  className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-black text-white cursor-pointer hover:bg-white hover:text-black border border-black transition-colors"
                >
                  全部替换
                </button>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}; 