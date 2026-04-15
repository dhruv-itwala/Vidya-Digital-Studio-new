// ============================
// UGCCreators.service.js
// ============================
import UGCCreator from "./UGCCreators.model.js";

export const createUGCCreator = async (data) => {
  return await UGCCreator.create(data);
};

export const getAllUGCCreators = async (query) => {
  const {
    search,
    minFollowers,
    maxFollowers,
    contentType,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { instagramId: { $regex: search, $options: "i" } },
    ];
  }

  if (minFollowers || maxFollowers) {
    filter.followers = {};
    if (minFollowers) filter.followers.$gte = Number(minFollowers);
    if (maxFollowers) filter.followers.$lte = Number(maxFollowers);
  }

  if (contentType) {
    filter.contentTypes = { $in: contentType.split(",") };
  }

  const skip = (page - 1) * limit;

  const ugcCreators = await UGCCreator.find(filter)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await UGCCreator.countDocuments(filter);

  return {
    data: ugcCreators,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

export const updateUGCCreator = async (id, data) => {
  return await UGCCreator.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const deleteUGCCreator = async (id) => {
  return await UGCCreator.findByIdAndDelete(id);
};
