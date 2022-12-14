import React, { useEffect } from 'react';
import socket from '../core/sockets/sockets';
import { useRecoilState } from 'recoil';
import { titleState } from '../atoms/titleAtom';
import useToast from '../hooks/useToast';
import { useParams } from 'react-router-dom';

const useTitle = () => {
  const [title, setTitle] = useRecoilState(titleState);
  const { alertToast } = useToast();
  const { document_id } = useParams();
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const saveNewTitle = async (title: string) => {
    try {
      await fetch(`http://localhost:8000/document/${document_id}/save-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ title })
      });
      setTitle(title);
    } catch (err) {
      alertToast('WARNING', '제목 저장에 실패했어요. 🥲  다시 시도해주세요.');
    }
  };

  const onTitleUpdate = () => {
    socket.emit('update-title', title);
    saveNewTitle(title);
  };

  useEffect(() => {
    socket.on('new-title', (newTitle) => {
      setTitle(newTitle);
    });
    return () => {
      socket.removeAllListeners();
    };
  }, []);

  return {
    title,
    onTitleChange,
    onTitleUpdate,
    setTitle
  };
};

export default useTitle;
