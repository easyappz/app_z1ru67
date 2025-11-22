import React, { useEffect, useState } from 'react';
import { registerMember, loginMember, fetchCurrentMember, logoutMember } from '../../api/auth';
import { fetchChatMessages, sendChatMessage } from '../../api/chat';

export const Home = () => {
  const [currentMember, setCurrentMember] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [authTab, setAuthTab] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  function sortMessagesByDate(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    const copy = list.slice();
    copy.sort(function (a, b) {
      const aTime = a && a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b && b.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
    return copy;
  }

  function formatDateTime(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function loadMessages() {
    setIsChatLoading(true);
    setChatError('');
    try {
      const data = await fetchChatMessages();
      const sorted = sortMessagesByDate(data);
      setMessages(sorted);
    } catch (error) {
      setChatError('Не удалось загрузить сообщения.');
    } finally {
      setIsChatLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.handleRoutes === 'function') {
      window.handleRoutes(['/']);
    }

    async function init() {
      setIsCheckingAuth(true);
      setAuthError('');
      try {
        const member = await fetchCurrentMember();
        setCurrentMember(member);
        await loadMessages();
      } catch (error) {
        if (error && error.response && error.response.status === 401) {
          setCurrentMember(null);
        } else {
          setAuthError('Не удалось проверить сессию. Попробуйте обновить страницу.');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    }

    init();
  }, []);

  function handleSwitchTab(tab) {
    setAuthTab(tab);
    setAuthError('');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!authUsername || !authPassword) {
      setAuthError('Пожалуйста, заполните все поля.');
      return;
    }

    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      let member;
      if (authTab === 'login') {
        member = await loginMember({ username: authUsername, password: authPassword });
      } else {
        member = await registerMember({ username: authUsername, password: authPassword });
      }
      setCurrentMember(member);
      setAuthUsername('');
      setAuthPassword('');
      await loadMessages();
    } catch (error) {
      let message = '';
      if (error && error.response && error.response.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          message = data;
        } else if (data.detail && typeof data.detail === 'string') {
          message = data.detail;
        } else if (data.error && typeof data.error === 'string') {
          message = data.error;
        }
      }
      if (!message) {
        if (authTab === 'login') {
          message = 'Не удалось войти. Проверьте имя пользователя и пароль.';
        } else {
          message = 'Не удалось зарегистрироваться. Попробуйте другое имя пользователя.';
        }
      }
      setAuthError(message);
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutMember();
    } catch (error) {
    }
    setCurrentMember(null);
    setMessages([]);
    setMessageText('');
    setChatError('');
    setMessageError('');
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) {
      setMessageError('Введите текст сообщения.');
      return;
    }

    setMessageError('');
    setChatError('');
    setIsSendingMessage(true);

    try {
      const newMessage = await sendChatMessage(trimmed);
      setMessageText('');
      setMessages(function (prev) {
        const next = Array.isArray(prev) ? prev.slice() : [];
        next.push(newMessage);
        return sortMessagesByDate(next);
      });
    } catch (error) {
      setChatError('Не удалось отправить сообщение.');
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <div data-easytag="id1-src/components/Home/index.jsx" className="home-root">
      <div className="home-container">
        {isCheckingAuth ? (
          <div className="global-loading">Загрузка...</div>
        ) : currentMember ? (
          <>
            <div className="chat-header">
              <div className="chat-greeting">
                Привет, {currentMember && currentMember.username ? currentMember.username : ''}
              </div>
              <button
                type="button"
                className="secondary-button chat-logout-button"
                onClick={handleLogout}
                disabled={isAuthSubmitting}
              >
                Выйти
              </button>
            </div>
            <div className="chat-body">
              {chatError ? <div className="chat-error">{chatError}</div> : null}
              {isChatLoading ? (
                <div className="chat-loading">Загрузка сообщений...</div>
              ) : (
                <div className="chat-messages-container">
                  {messages && messages.length > 0 ? (
                    messages.map(function (message) {
                      return (
                        <div key={message.id} className="chat-message">
                          <div className="chat-message-main">
                            <span className="chat-message-username">
                              {message.member_username}
                            </span>
                            <span className="chat-message-text">{message.text}</span>
                          </div>
                          <div className="chat-message-meta">
                            {formatDateTime(message.created_at)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="chat-empty">Сообщений пока нет</div>
                  )}
                </div>
              )}
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="chat-input-row">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Напишите сообщение..."
                    value={messageText}
                    onChange={function (event) {
                      setMessageText(event.target.value);
                    }}
                    disabled={isSendingMessage}
                  />
                  <button
                    type="submit"
                    className="primary-button chat-send-button"
                    disabled={isSendingMessage || !messageText.trim()}
                  >
                    Отправить
                  </button>
                </div>
                {messageError ? (
                  <div className="chat-message-error">{messageError}</div>
                ) : null}
              </form>
            </div>
          </>
        ) : (
          <div className="auth-layout">
            <h1 className="auth-title">Групповой чат</h1>
            <div className="auth-tabs">
              <button
                type="button"
                className={authTab === 'login' ? 'auth-tab auth-tab-active' : 'auth-tab'}
                onClick={function () {
                  handleSwitchTab('login');
                }}
              >
                Вход
              </button>
              <button
                type="button"
                className={authTab === 'register' ? 'auth-tab auth-tab-active' : 'auth-tab'}
                onClick={function () {
                  handleSwitchTab('register');
                }}
              >
                Регистрация
              </button>
            </div>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-username">
                  Имя пользователя
                </label>
                <input
                  id="auth-username"
                  type="text"
                  className="auth-input"
                  value={authUsername}
                  onChange={function (event) {
                    setAuthUsername(event.target.value);
                  }}
                  autoComplete="username"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-password">
                  Пароль
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="auth-input"
                  value={authPassword}
                  onChange={function (event) {
                    setAuthPassword(event.target.value);
                  }}
                  autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {authError ? <div className="auth-error">{authError}</div> : null}
              <button
                type="submit"
                className="primary-button auth-submit-button"
                disabled={isAuthSubmitting}
              >
                {authTab === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
