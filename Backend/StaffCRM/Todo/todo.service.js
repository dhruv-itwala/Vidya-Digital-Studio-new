import Todo from "./todo.model.js";

// Helper: get yesterday
const getYesterday = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export const getTodoByDateService = async (userId, date) => {
  let todo = await Todo.findOne({ user: userId, date });

  const yesterday = getYesterday(date);
  const yesterdayTodo = await Todo.findOne({
    user: userId,
    date: yesterday,
  });

  // 1️⃣ Create today's todo if missing
  if (!todo) {
    todo = await Todo.create({
      user: userId,
      date,
      title: "Today",
      items: [],
    });
  }

  // 2️⃣ Carry forward ONLY if:
  // - today has no items
  // - yesterday exists
  // - yesterday has pending tasks
  if (
    todo.items.length === 0 &&
    yesterdayTodo &&
    yesterdayTodo.items.some((item) => !item.done)
  ) {
    const pendingItems = yesterdayTodo.items.filter((item) => !item.done);

    todo.items.push(
      ...pendingItems.map((item) => ({
        text: item.text,
        done: false,
        carriedFrom: yesterday, // optional but recommended
      })),
    );

    await todo.save();
  }

  return todo;
};

// Add a new todo item
export const addTodoItemService = async (userId, date, text) => {
  const todo = await getTodoByDateService(userId, date);

  todo.items.push({ text });
  await todo.save();

  return todo;
};

// Toggle the completion status of a todo item
export const toggleTodoItemService = async (userId, itemId) => {
  const todo = await Todo.findOne({ "items._id": itemId, user: userId });
  if (!todo) throw new Error("Item not found");

  const item = todo.items.id(itemId);
  item.done = !item.done;

  await todo.save();
  return todo;
};

// Delete a todo item
export const deleteTodoItemService = async (userId, itemId) => {
  const todo = await Todo.findOne({ "items._id": itemId, user: userId });
  if (!todo) throw new Error("Item not found");

  todo.items = todo.items.filter((i) => i._id.toString() !== itemId);
  await todo.save();

  return todo;
};
