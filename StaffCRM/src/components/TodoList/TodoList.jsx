import { useEffect, useState } from "react";
import styles from "./TodoList.module.css";
import {
  addTodoItemAPI,
  toggleTodoItemAPI,
  deleteTodoItemAPI,
  getTodoByDateAPI,
} from "../../api/todo.api";
import toast from "react-hot-toast";
const today = () => new Date().toISOString().split("T")[0];

export default function TodoList() {
  const [todo, setTodo] = useState(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());

  useEffect(() => {
    load();
  }, [date]);

  const load = async () => {
    try {
      const res = await getTodoByDateAPI(date);
      setTodo(res.data);
    } catch (e) {
      toast.error(e.message);
    }
  };
  const addItem = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await addTodoItemAPI(text, date);
      setTodo(res.data);
      setText("");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggle = async (id) => {
    try {
      const res = await toggleTodoItemAPI(id);
      setTodo(res.data);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (id) => {
    try {
      const res = await deleteTodoItemAPI(id);
      setTodo(res.data);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!todo) return null;

  return (
    <div className="masterContainer">
      <div className={styles.todoWrap}>
        <h2 className={styles.title}>To do List</h2>
        <div className={styles.dateRow}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.dateInput}
          />

          <form onSubmit={addItem} className={styles.inputRow}>
            <input
              type="text"
              className={styles.textInput}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a note..."
            />
          </form>
        </div>
        <div className={styles.list}>
          {todo.items.length === 0 && <p>No to-do items.</p>}
          {todo.items.map((item) => (
            <div
              key={item._id}
              className={`${styles.item} ${item.done ? styles.done : ""}`}
            >
              <div className={styles.left} onClick={() => toggle(item._id)}>
                <div className={styles.checkbox}>{item.done && "✓"}</div>
                <span>{item.text}</span>
              </div>

              <div className={styles.delete} onClick={() => remove(item._id)}>
                ×
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
