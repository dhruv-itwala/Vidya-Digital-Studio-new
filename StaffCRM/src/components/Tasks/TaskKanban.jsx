import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import styles from "./Task.module.css";

const columns = [
  { id: "pending", label: "Pending" },
  { id: "started", label: "Started" },
  { id: "hold", label: "On Hold" },
  { id: "complete", label: "Completed" },
];

export default function TaskKanban({
  tasks,
  onStatusChange,
  onDelete,
  onEdit,
}) {
  const grouped = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });

    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    }

    return map;
  }, [tasks]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return; // prevent unnecessary updates

    onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.kanban}>
        {columns.map((col) => (
          <Droppable droppableId={col.id} key={col.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={styles.column}
              >
                <h4 className={styles.columnTitle}>{col.label}</h4>

                {grouped[col.id]?.map((task, index) => (
                  <Draggable
                    key={task._id}
                    draggableId={task._id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskCard
                          task={task}
                          onStatusChange={onStatusChange}
                          onDelete={onDelete}
                          onEdit={onEdit}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
