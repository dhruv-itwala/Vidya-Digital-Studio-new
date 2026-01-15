import Client from "./client.model.js";

export const createClientService = async (data) => {
  if (!data.clientName) throw new Error("Client name is required");
  if (!data.payment?.amount) throw new Error("Payment amount is required");

  return Client.create(data);
};

export const getAllClientsService = async () => {
  return Client.find({ isActive: true }).sort({ createdAt: -1 });
};

export const getClientByIdService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new Error("Client not found");
  return client;
};

export const updateClientService = async (id, data) => {
  const client = await Client.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!client) throw new Error("Client not found");
  return client;
};

export const deleteClientService = async (id) => {
  const client = await Client.findById(id);
  if (!client) throw new Error("Client not found");

  client.isActive = false;
  await client.save();
};
