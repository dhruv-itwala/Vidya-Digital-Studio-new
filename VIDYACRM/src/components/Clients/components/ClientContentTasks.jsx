import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { FiCalendar, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import styles from "./ClientContentTasks.module.css";
import toast from "react-hot-toast";

export default function ClientContentTasks({ clientId, readOnly }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    platform: "Instagram",
    postType: "Story",
    title: "",
    publishDate: "",
    assignedRoles: [],
    notes: ""
  });
  
  const [roleInput, setRoleInput] = useState("");

  useEffect(() => {
    if (clientId) fetchTasks();
  }, [clientId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/content-tasks/client/${clientId}`);
      setTasks(res.data.data);
    } catch (error) {
      toast.error("Failed to load content tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    if (!roleInput.trim()) return;
    if (newTask.assignedRoles.includes(roleInput.trim())) return;
    setNewTask({ ...newTask, assignedRoles: [...newTask.assignedRoles, roleInput.trim()] });
    setRoleInput("");
  };

  const handleSaveTask = async () => {
    if (!newTask.title || !newTask.publishDate) {
      toast.error("Title and Publish Date are required");
      return;
    }
    
    try {
      setLoading(true);
      await api.post("/content-tasks", { ...newTask, client: clientId });
      toast.success("Task added successfully");
      setIsAdding(false);
      setNewTask({ platform: "Instagram", postType: "Story", title: "", publishDate: "", assignedRoles: [], notes: "" });
      fetchTasks();
    } catch (error) {
      toast.error("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this content task?")) return;
    try {
      setLoading(true);
      await api.delete(`/content-tasks/${taskId}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitle}>
          <FiCalendar className={styles.icon} />
          <h3>Content Calendar Tasks (Auto-Reminders)</h3>
        </div>
        {!readOnly && (
          <button 
            type="button" 
            onClick={() => setIsAdding(!isAdding)}
            className={styles.addBtn}
          >
            <FiPlus /> {isAdding ? "Cancel" : "Add Task"}
          </button>
        )}
      </div>

      {isAdding && !readOnly && (
        <div className={styles.addForm}>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>Title</label>
              <div className={styles.inputWrapper}>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Diwali Special Post" />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Publish Date</label>
              <div className={styles.inputWrapper}>
                <input type="date" value={newTask.publishDate} onChange={e => setNewTask({...newTask, publishDate: e.target.value})} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Platform</label>
              <div className={styles.inputWrapper}>
                <select value={newTask.platform} onChange={e => setNewTask({...newTask, platform: e.target.value})}>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter">Twitter</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Post Type</label>
              <div className={styles.inputWrapper}>
                <select value={newTask.postType} onChange={e => setNewTask({...newTask, postType: e.target.value})}>
                  <option value="Story">Story</option>
                  <option value="Post">Post</option>
                  <option value="Reel">Reel</option>
                  <option value="Carousel">Carousel</option>
                  <option value="Video">Video</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className={styles.inputGroup} style={{ marginTop: '1.25rem' }}>
            <label>Assigned Roles to Notify (Designations)</label>
            <div className={styles.roleInputRow}>
              <input type="text" value={roleInput} onChange={e => setRoleInput(e.target.value)} placeholder="e.g. Graphic Designer" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())} />
              <button type="button" onClick={handleAddRole}>Add Role</button>
            </div>
            <div className={styles.rolesTags}>
              {newTask.assignedRoles.map(role => (
                <span key={role} className={styles.roleTag}>
                  {role} <button type="button" onClick={() => setNewTask({...newTask, assignedRoles: newTask.assignedRoles.filter(r => r !== role)})}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleSaveTask} disabled={loading} className={styles.saveTaskBtn}>
            {loading ? "Saving..." : "Save Content Task"}
          </button>
        </div>
      )}

      {loading && !isAdding ? <p>Loading tasks...</p> : (
        <div className={styles.taskList}>
          {tasks.length === 0 ? <p className={styles.emptyState}>No content tasks scheduled.</p> : tasks.map(task => (
            <div key={task._id} className={styles.taskItem}>
              <div>
                <h4 className={styles.taskTitle}>{task.title}</h4>
                <p className={styles.taskMeta}>{new Date(task.publishDate).toLocaleDateString()} | {task.platform} ({task.postType})</p>
                <div className={styles.taskRoles}>
                  {task.assignedRoles.map(r => (
                    <span key={r} className={styles.taskRoleBadge}>{r}</span>
                  ))}
                </div>
              </div>
              {!readOnly && (
                <button type="button" onClick={() => handleDelete(task._id)} className={styles.deleteBtn} title="Delete Task">
                  <FiTrash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
