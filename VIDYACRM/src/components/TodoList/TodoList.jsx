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
import Loader from "../Loader/Loader";
import InlineLoader from "../UI/InlineLoader";

const today = () => new Date().toISOString().split("T")[0];

export default function TodoList() {
  const [todo, setTodo] = useState(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTodoByDateAPI(date);
        if (isMounted) setTodo(res.data);
      } catch (e) {
        if (isMounted) toast.error(e.message || "Failed to load tasks");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [date]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await addTodoItemAPI(text.trim(), date);
      setTodo(res.data);
      setText("");
    } catch (e) {
      toast.error(e.message || "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (id) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const res = await toggleTodoItemAPI(id);
      setTodo(res.data);
    } catch (e) {
      toast.error(e.message || "Failed to update task");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await deleteTodoItemAPI(id);
      setTodo(res.data);
    } catch (e) {
      toast.error(e.message || "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !todo) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>My To-Do List</h2>
          <p className={styles.subtitle}>Stay organized and track your daily tasks.</p>
        </div>
        <Loader />
      </div>
    );
  }

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
              <button type="submit" className={styles.addBtn} disabled={!text.trim() || submitting}>
                {submitting ? <InlineLoader size={16} /> : <FiPlus />}
                <span>{submitting ? "Adding..." : "Add Task"}</span>
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
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <InlineLoader size={28} />
              </div>
            ) : todo.items.length === 0 ? (
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
                      {togglingId === item._id ? (
                        <InlineLoader size={12} />
                      ) : (
                        item.done && <FiCheck className={styles.checkIcon} />
                      )}
                    </div>
                    <span className={styles.itemText}>{item.text}</span>
                  </div>

                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => remove(item._id)}
                    disabled={deletingId === item._id}
                    title="Delete task"
                  >
                    {deletingId === item._id ? <InlineLoader size={14} /> : <FiTrash2 />}
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
