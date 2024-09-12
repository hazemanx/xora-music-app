// src/components/QueueViewer.js
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function QueueViewer({ queue, currentTrackIndex, onTrackSelect, onReorderQueue }) {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    onReorderQueue(result.source.index, result.destination.index);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Up Next</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {queue.map((track, index) => (
                <Draggable key={track.id} draggableId={track.id.toString()} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-2 mb-2 rounded ${
                        index === currentTrackIndex ? 'bg-blue-600' : 'bg-gray-700'
                      } text-white cursor-pointer`}
                      onClick={() => onTrackSelect(index)}
                    >
                      {track.title} - {track.artist}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default QueueViewer;