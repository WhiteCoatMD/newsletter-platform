import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface EditorBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'heading';
  content: any;
  style?: any;
}

interface DragDropEditorProps {
  initialBlocks?: EditorBlock[];
  onChange?: (blocks: EditorBlock[]) => void;
}

const ItemTypes = {
  BLOCK: 'block'
};

const DraggableBlock: React.FC<{
  block: EditorBlock;
  index: number;
  moveBlock: (dragIndex: number, hoverIndex: number) => void;
  updateBlock: (id: string, updates: Partial<EditorBlock>) => void;
  deleteBlock: (id: string) => void;
}> = ({ block, index, moveBlock, updateBlock, deleteBlock }) => {
  const [, drag] = useDrag({
    type: ItemTypes.BLOCK,
    item: { id: block.id, index }
  });

  const [, drop] = useDrop({
    accept: ItemTypes.BLOCK,
    hover: (draggedItem: { id: string; index: number }) => {
      if (draggedItem.index !== index) {
        moveBlock(draggedItem.index, index);
        draggedItem.index = index;
      }
    }
  });

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => updateBlock(block.id, { content: { ...block.content, text: e.target.value } })}
            placeholder="Enter heading text"
            className="w-full p-2 border rounded text-lg font-bold"
          />
        );
      case 'text':
        return (
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlock(block.id, { content: { ...block.content, text: e.target.value } })}
            placeholder="Enter your text here"
            className="w-full p-2 border rounded min-h-[100px] resize-none"
          />
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={block.content.src || ''}
              onChange={(e) => updateBlock(block.id, { content: { ...block.content, src: e.target.value } })}
              placeholder="Image URL"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={block.content.alt || ''}
              onChange={(e) => updateBlock(block.id, { content: { ...block.content, alt: e.target.value } })}
              placeholder="Alt text"
              className="w-full p-2 border rounded"
            />
            {block.content.src && (
              <img src={block.content.src} alt={block.content.alt} className="max-w-full h-auto" />
            )}
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content.text || ''}
              onChange={(e) => updateBlock(block.id, { content: { ...block.content, text: e.target.value } })}
              placeholder="Button text"
              className="w-full p-2 border rounded"
            />
            <input
              type="url"
              value={block.content.url || ''}
              onChange={(e) => updateBlock(block.id, { content: { ...block.content, url: e.target.value } })}
              placeholder="Button URL"
              className="w-full p-2 border rounded"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              style={{ backgroundColor: block.content.color || '#3B82F6' }}
            >
              {block.content.text || 'Button'}
            </button>
          </div>
        );
      case 'divider':
        return <hr className="border-t-2 border-gray-300 my-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className="relative group border border-gray-200 rounded p-4 mb-4 hover:border-blue-300 cursor-move"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => deleteBlock(block.id)}
          className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="block-content">
        {renderBlockContent()}
      </div>
    </div>
  );
};

const DragDropEditor: React.FC<DragDropEditorProps> = ({
  initialBlocks = [],
  onChange
}) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);

  const addBlock = useCallback((type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'heading' ? { text: '', level: 2 } :
               type === 'text' ? { text: '' } :
               type === 'image' ? { src: '', alt: '' } :
               type === 'button' ? { text: '', url: '', color: '#3B82F6' } :
               {}
    };

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  }, [blocks, onChange]);

  const moveBlock = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedBlock = blocks[dragIndex];
    const newBlocks = [...blocks];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, draggedBlock);

    setBlocks(newBlocks);
    onChange?.(newBlocks);
  }, [blocks, onChange]);

  const updateBlock = useCallback((id: string, updates: Partial<EditorBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  }, [blocks, onChange]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="drag-drop-editor">
        <div className="toolbar mb-4 p-4 bg-gray-50 rounded flex flex-wrap gap-2">
          <button
            onClick={() => addBlock('heading')}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Heading
          </button>
          <button
            onClick={() => addBlock('text')}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => addBlock('image')}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Image
          </button>
          <button
            onClick={() => addBlock('button')}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Button
          </button>
          <button
            onClick={() => addBlock('divider')}
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Divider
          </button>
        </div>

        <div className="blocks-container">
          {blocks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No blocks added yet. Use the toolbar above to add content blocks.</p>
            </div>
          ) : (
            blocks.map((block, index) => (
              <DraggableBlock
                key={block.id}
                block={block}
                index={index}
                moveBlock={moveBlock}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
              />
            ))
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default DragDropEditor;