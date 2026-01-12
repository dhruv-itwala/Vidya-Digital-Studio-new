import Todo from "./todo.model.js";

// Get or create todo for a date
export const getTodoByDateService = async (userId, date) => {
  let todo = await Todo.findOne({ user: userId, date });

  if (!todo) {
    todo = await Todo.create({
      user: userId,
      date,
      title: "Today",
      items: [],
    });
  }

  return todo;
};

export const addTodoItemService = async (userId, date, text) => {
  const todo = await getTodoByDateService(userId, date);

  todo.items.push({ text });
  await todo.save();

  return todo;
};

export const toggleTodoItemService = async (userId, itemId) => {
  const todo = await Todo.findOne({ "items._id": itemId, user: userId });
  if (!todo) throw new Error("Item not found");

  const item = todo.items.id(itemId);
  item.done = !item.done;

  await todo.save();
  return todo;
};

export const deleteTodoItemService = async (userId, itemId) => {
  const todo = await Todo.findOne({ "items._id": itemId, user: userId });
  if (!todo) throw new Error("Item not found");

  todo.items = todo.items.filter((i) => i._id.toString() !== itemId);
  await todo.save();

  return todo;
};
