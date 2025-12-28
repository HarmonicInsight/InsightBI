'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ThreadComment, User, UserRole, CommentReaction } from '@/lib/types';

// Demo users for the system
const DEMO_USERS: User[] = [
  { id: 'u1', name: '山田太郎', email: 'yamada@example.com', role: '経営層', department: '経営企画部', avatarColor: 'bg-blue-500' },
  { id: 'u2', name: '佐藤花子', email: 'sato@example.com', role: '現場担当', department: '営業部', avatarColor: 'bg-green-500' },
  { id: 'u3', name: '鈴木一郎', email: 'suzuki@example.com', role: 'プロジェクトマネージャー', department: 'プロジェクト管理部', avatarColor: 'bg-purple-500' },
  { id: 'u4', name: '田中美咲', email: 'tanaka@example.com', role: '管理部門', department: '経理部', avatarColor: 'bg-amber-500' },
  { id: 'u5', name: '高橋健二', email: 'takahashi@example.com', role: '現場担当', department: '技術部', avatarColor: 'bg-red-500' },
  { id: 'u6', name: '伊藤真理', email: 'ito@example.com', role: '経営層', department: '取締役', avatarColor: 'bg-indigo-500' },
];

const CURRENT_USER = DEMO_USERS[0];

const REACTION_OPTIONS = ['👍', '👀', '🙏', '✅', '❤️', '🎉'];

interface CommentSystemProps {
  actionId: string;
  comments: ThreadComment[];
  onAddComment: (comment: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'reactions' | 'replies'>) => void;
  onAddReply: (parentId: string, comment: Omit<ThreadComment, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'reactions' | 'replies'>) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  onMentionUser?: (userId: string, commentId: string) => void;
}

// Mention Suggest Component
interface MentionSuggestProps {
  query: string;
  users: User[];
  onSelect: (user: User) => void;
  position: { top: number; left: number };
  visible: boolean;
}

function MentionSuggest({ query, users, onSelect, position, visible }: MentionSuggestProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    const lowerQuery = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.department.toLowerCase().includes(lowerQuery)
    );
  }, [query, users]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!visible || filteredUsers.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64"
      style={{ top: position.top, left: position.left }}
    >
      {filteredUsers.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-left ${
            index === selectedIndex ? 'bg-slate-100' : ''
          }`}
        >
          <div className={`w-7 h-7 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-xs font-medium`}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.department}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Comment Input Component
interface CommentInputProps {
  actionId: string;
  parentId?: string | null;
  onSubmit: (content: string, mentions: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function CommentInput({ actionId, parentId, onSubmit, onCancel, placeholder = 'コメントを入力... @でメンション', autoFocus = false }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [showMentionSuggest, setShowMentionSuggest] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentionSuggest) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (showMentionSuggest) {
        setShowMentionSuggest(false);
      } else if (onCancel) {
        onCancel();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setShowMentionSuggest(true);

        // Calculate position for mention dropdown
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setMentionPosition({
            top: 60,
            left: Math.min(atIndex * 8, 200)
          });
        }
      } else {
        setShowMentionSuggest(false);
      }
    } else {
      setShowMentionSuggest(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const newContent =
      content.substring(0, atIndex) +
      `@${user.name} ` +
      content.substring(cursorPos);

    setContent(newContent);
    setMentions([...mentions, user.id]);
    setShowMentionSuggest(false);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    // Extract mentions from content
    const mentionPattern = /@(\S+)/g;
    const extractedMentions: string[] = [];
    let match;
    while ((match = mentionPattern.exec(content)) !== null) {
      const mentionName = match[1];
      const user = DEMO_USERS.find(u => u.name === mentionName);
      if (user && !extractedMentions.includes(user.id)) {
        extractedMentions.push(user.id);
      }
    }

    onSubmit(content, extractedMentions);
    setContent('');
    setMentions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className={`w-8 h-8 rounded-full ${CURRENT_USER.avatarColor} flex items-center justify-center text-white text-sm font-medium shrink-0`}>
          {CURRENT_USER.name.charAt(0)}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-slate-400">
              Shift+Enter で改行、Enter で送信
            </div>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
      <MentionSuggest
        query={mentionQuery}
        users={DEMO_USERS.filter(u => u.id !== CURRENT_USER.id)}
        onSelect={handleMentionSelect}
        position={mentionPosition}
        visible={showMentionSuggest}
      />
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: ThreadComment;
  depth: number;
  onReply: (parentId: string) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  replyingTo: string | null;
  onSubmitReply: (content: string, mentions: string[]) => void;
  onCancelReply: () => void;
}

function CommentItem({ comment, depth, onReply, onAddReaction, replyingTo, onSubmitReply, onCancelReply }: CommentItemProps) {
  const [showReactions, setShowReactions] = useState(false);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case '経営層': return 'bg-amber-100 text-amber-700';
      case 'プロジェクトマネージャー': return 'bg-purple-100 text-purple-700';
      case '管理部門': return 'bg-blue-100 text-blue-700';
      case '現場担当': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Render content with highlighted mentions
  const renderContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-indigo-600 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const maxDepth = 3;
  const indentClass = depth > 0 ? 'ml-8 border-l-2 border-slate-100 pl-4' : '';

  return (
    <div className={`${indentClass}`}>
      <div className="py-3">
        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-full ${comment.authorAvatarColor || 'bg-slate-400'} flex items-center justify-center text-white text-sm font-medium shrink-0`}>
            {comment.authorName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800">{comment.authorName}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(comment.authorRole)}`}>
                {comment.authorRole}
              </span>
              <span className="text-xs text-slate-400">{formatRelativeTime(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-xs text-slate-400">(編集済み)</span>
              )}
            </div>
            <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
              {renderContent(comment.content)}
            </div>

            {/* Reactions Display */}
            {comment.reactions && comment.reactions.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {comment.reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAddReaction(comment.id, reaction.emoji)}
                    className={`px-2 py-0.5 text-sm rounded-full border ${
                      reaction.userIds.includes(CURRENT_USER.id)
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {reaction.emoji} {reaction.userIds.length}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  リアクション
                </button>
                {showReactions && (
                  <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex gap-1 z-10">
                    {REACTION_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onAddReaction(comment.id, emoji);
                          setShowReactions(false);
                        }}
                        className="w-8 h-8 hover:bg-slate-100 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {depth < maxDepth && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  返信
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-3">
                <CommentInput
                  actionId={comment.actionId}
                  parentId={comment.id}
                  onSubmit={onSubmitReply}
                  onCancel={onCancelReply}
                  placeholder={`${comment.authorName}さんに返信...`}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onAddReaction={onAddReaction}
              replyingTo={replyingTo}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Comment Section Component
export default function CommentSystem({ actionId, comments, onAddComment, onAddReply, onAddReaction, onMentionUser }: CommentSystemProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Build comment tree from flat comments
  const commentTree = useMemo(() => {
    const topLevel: ThreadComment[] = [];
    const byId = new Map<string, ThreadComment>();

    // First pass: index all comments
    comments.forEach(c => {
      byId.set(c.id, { ...c, replies: [] });
    });

    // Second pass: build tree
    comments.forEach(c => {
      const comment = byId.get(c.id)!;
      if (c.parentId && byId.has(c.parentId)) {
        const parent = byId.get(c.parentId)!;
        if (!parent.replies) parent.replies = [];
        parent.replies.push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    // Sort by createdAt
    const sortByDate = (a: ThreadComment, b: ThreadComment) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    topLevel.sort(sortByDate);
    const sortReplies = (items: ThreadComment[]) => {
      items.sort(sortByDate);
      items.forEach(item => {
        if (item.replies) sortReplies(item.replies);
      });
    };
    sortReplies(topLevel);

    return topLevel;
  }, [comments]);

  const handleSubmitComment = (content: string, mentions: string[]) => {
    onAddComment({
      actionId,
      parentId: null,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorRole: CURRENT_USER.role,
      authorAvatarColor: CURRENT_USER.avatarColor,
      content,
      mentions,
    });

    // Notify mentioned users
    mentions.forEach(userId => {
      if (onMentionUser) {
        onMentionUser(userId, 'new');
      }
    });
  };

  const handleSubmitReply = (content: string, mentions: string[]) => {
    if (!replyingTo) return;

    onAddReply(replyingTo, {
      actionId,
      parentId: replyingTo,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorRole: CURRENT_USER.role,
      authorAvatarColor: CURRENT_USER.avatarColor,
      content,
      mentions,
    });

    setReplyingTo(null);

    // Notify mentioned users
    mentions.forEach(userId => {
      if (onMentionUser) {
        onMentionUser(userId, 'reply');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-800">
          コメント ({comments.length})
        </h4>
      </div>

      {/* Comment List */}
      <div className="space-y-0 divide-y divide-slate-100">
        {commentTree.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            まだコメントはありません
          </p>
        ) : (
          commentTree.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={setReplyingTo}
              onAddReaction={onAddReaction}
              replyingTo={replyingTo}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => setReplyingTo(null)}
            />
          ))
        )}
      </div>

      {/* New Comment Input */}
      <div className="pt-4 border-t border-slate-100">
        <CommentInput
          actionId={actionId}
          onSubmit={handleSubmitComment}
          placeholder="コメントを追加... @でメンション"
        />
      </div>
    </div>
  );
}

// Export components for individual use
export { CommentInput, CommentItem, MentionSuggest };
export { DEMO_USERS, CURRENT_USER };
