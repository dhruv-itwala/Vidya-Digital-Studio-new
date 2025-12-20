import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import styles from "./Task.module.css";
const columns = ["pending", "started", "hold", "complete"];

export default function TaskKanban({
  tasks,
  onStatusChange,
  onDelete,
  onEdit,
}) {
  const grouped = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.status === col);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;

    onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.kanban}>
        {columns.map((col) => (
          <Droppable droppableId={col} key={col}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  background: "#f9fafb",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <h4>{col.toUpperCase()}</h4>

                {grouped[col].map((task, index) => (
                  <Draggable
                    draggableId={task._id}
                    index={index}
                    key={task._id}
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
                          onEdit={onEdit} // <-- Pass onEdit here
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
