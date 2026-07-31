import { useEffect, useState } from "react";
import styles from "./TodoList.module.css";
import {
  addTodoItemAPI,
  toggleTodoItemAPI,
  deleteTodoItemAPI,
  getTodoByDateAPI,
} from "../../api/todo.api";
import toast from "react-hot-toast";
import { FiCheck, FiTrash2, FiPlus, FiCalendar, FiList } from "react-icons/fi";

const today = () => new Date().toISOString().split("T")[0];

export default function TodoList() {
  const [todo, setTodo] = useState(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTodoByDateAPI(date);
        setTodo(res.data);
      } catch (e) {
        toast.error(e.message);
      }
    };
    load();
  }, [date]);

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
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>My To-Do List</h2>
        <p className={styles.subtitle}>Stay organized and track your daily tasks.</p>
      </div>

      <div className={styles.contentGrid}>
        
        {/* ADD TASK SECTION */}
        <div className={styles.addCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperNeutral}>
              <FiPlus />
            </div>
            <h3>Add New Task</h3>
          </div>

          <form onSubmit={addItem} className={styles.addForm}>
            <div className={styles.datePickerWrap}>
              <FiCalendar className={styles.inputIcon} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            
            <div className={styles.textInputWrap}>
              <input
                type="text"
                className={styles.textInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What needs to be done?"
              />
              <button type="submit" className={styles.addBtn} disabled={!text.trim()}>
                <FiPlus /> Add Task
              </button>
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className={styles.listCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperGreen}>
              <FiList />
            </div>
            <h3>Tasks for {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</h3>
          </div>

          <div className={styles.list}>
            {todo.items.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No tasks scheduled for this day.</p>
              </div>
            ) : (
              todo.items.map((item) => (
                <div
                  key={item._id}
                  className={`${styles.item} ${item.done ? styles.done : ""}`}
                >
                  <div className={styles.itemLeft} onClick={() => toggle(item._id)}>
                    <div className={styles.checkbox}>
                      {item.done && <FiCheck className={styles.checkIcon} />}
                    </div>
                    <span className={styles.itemText}>{item.text}</span>
                  </div>

                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => remove(item._id)}
                    title="Delete task"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
