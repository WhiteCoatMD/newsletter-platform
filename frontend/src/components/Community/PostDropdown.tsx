import React, { useState, useRef, useEffect } from 'react';
import {
  EllipsisVerticalIcon,
  FlagIcon,
  ShareIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface PostDropdownProps {
  postId: string;
  postTitle: string;
  isOwnPost?: boolean;
  onReport: (postId: string, postTitle: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

const PostDropdown: React.FC<PostDropdownProps> = ({
  postId,
  postTitle,
  isOwnPost = false,
  onReport,
  onEdit,
  onDelete,
  onBookmark,
  onHide,
  onShare
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {/* Share option */}
            {onShare && (
              <button
                onClick={() => handleAction(() => onShare(postId))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ShareIcon className="w-4 h-4 mr-3" />
                Share
              </button>
            )}

            {/* Bookmark option */}
            {onBookmark && (
              <button
                onClick={() => handleAction(() => onBookmark(postId))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <BookmarkIcon className="w-4 h-4 mr-3" />
                Bookmark
              </button>
            )}

            {/* Hide option */}
            {onHide && (
              <button
                onClick={() => handleAction(() => onHide(postId))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <EyeSlashIcon className="w-4 h-4 mr-3" />
                Hide
              </button>
            )}

            {/* Edit option (only for own posts) */}
            {isOwnPost && onEdit && (
              <button
                onClick={() => handleAction(() => onEdit(postId))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <PencilIcon className="w-4 h-4 mr-3" />
                Edit
              </button>
            )}

            {/* Delete option (only for own posts) */}
            {isOwnPost && onDelete && (
              <button
                onClick={() => handleAction(() => onDelete(postId))}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4 mr-3" />
                Delete
              </button>
            )}

            {/* Report option (not for own posts) */}
            {!isOwnPost && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleAction(() => onReport(postId, postTitle))}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FlagIcon className="w-4 h-4 mr-3" />
                  Report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDropdown;