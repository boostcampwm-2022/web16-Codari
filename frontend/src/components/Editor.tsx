import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import SimpleMDEReact from 'react-simplemde-editor';
import SimpleMDE from 'easymde';
import CodeMirror from 'codemirror';
import 'easymde/dist/easymde.min.css';
import { crdt } from '../core/crdt-linear-ll/crdt';
import socket from '../core/sockets/sockets';
import useDebounce from '../hooks/useDebounce';
import { fetchDataFromPath } from '../utils/fetchBeforeRender';
import useToast from '../hooks/useToast';
import { createCipheriv } from 'crypto';

const NAVBAR_HEIGHT = 70;
const WIDGET_HEIGHT = 70;

interface EditorProps {
  content: any;
}

const Editor = ({ content }: EditorProps) => {
  const [editor, setEditor] = useState<CodeMirror.Editor | null>(null);
  const { document_id } = useParams();

  useEffect(() => {
    socket.emit('joinroom', document_id);
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (Object.keys(content).length > 0) {
      try {
        Object.keys(content).forEach((key) => {
          content[key] = JSON.parse(content[key]);
        });
      } catch (e) {
        console.log(e);
      }
      crdt.syncDocument(content);
      editor.setValue(crdt.toString());
      editor.focus();
    }

    socket.on('remote-insert', (data) => {
      crdt.remoteInsert(data, editor);
    });

    socket.on('remote-delete', (data) => {
      crdt.remoteDelete(data, editor.getDoc());
    });

    editor?.on('beforeChange', async (_, change: CodeMirror.EditorChange) => {
      if (change.origin === 'setValue' || change.origin === 'remote') {
        return;
      }

      const fromIdx = editor.indexFromPos(change.from);
      const toIdx = editor.indexFromPos(change.to);
      const content = change.text.join('\n');
      let eventName = '';
      let char;
      switch (change.origin) {
        case 'paste':
          char = crdt.localInsertRange(fromIdx, content);
          eventName = 'local-insert';
          break;
        case '+input':
        case '*compose':
          char = crdt.localDelete(fromIdx, toIdx);
          socket.emit('local-delete', char);
          if (content === '') {
            return;
          }
          char = crdt.localInsertRange(fromIdx, content);
          eventName = 'local-insert';
          break;
        case '+delete':
          char = crdt.localDelete(fromIdx, toIdx);
          eventName = 'local-delete';
          break;
        default:
          if (fromIdx === toIdx) {
            char = crdt.localInsertRange(fromIdx, content);
            eventName = 'local-insert';
          } else {
            char = crdt.localDelete(fromIdx, toIdx);
            eventName = 'local-delete';
          }
      }
      // console.log('EVENT_NAME :', change.origin);
      // console.log('from : ', fromIdx);
      // console.log('to : ', toIdx);
      // console.log('EVENT Value :', change.text);
      socket.emit(eventName, char);
    });
    return () => {
      socket.removeAllListeners();
    };
  }, [editor]);

  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      placeholder: 'Write document here and share!',
      minHeight: `calc(100vh - ${NAVBAR_HEIGHT + WIDGET_HEIGHT}px)`,
      maxHeight: `calc(100vh - ${NAVBAR_HEIGHT + WIDGET_HEIGHT}px)`,
      sideBySideFullscreen: false,
      toolbar: ['side-by-side', 'preview', 'fullscreen'],
      unorderedListStyle: '-',
      status: false,
      shortcuts: {
        toggleUnorderedList: null
      }
    } as SimpleMDE.Options;
  }, []);

  const getCmInstanceCallback = useCallback((cm: CodeMirror.Editor) => {
    setEditor(cm);
  }, []);

  return (
    <>
      <SimpleMDEReact options={editorOptions} getCodemirrorInstance={getCmInstanceCallback} />
    </>
  );
};

export default Editor;
