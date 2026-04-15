// ============================
// Influencers.service.js
// ============================
import Influencer from "./Influencers.model.js";

export const createInfluencer = async (data) => {
  return await Influencer.create(data);
};

export const getAllInfluencers = async (query) => {
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

  const influencers = await Influencer.find(filter)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Influencer.countDocuments(filter);

  return {
    data: influencers,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

export const updateInfluencer = async (id, data) => {
  return await Influencer.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const deleteInfluencer = async (id) => {
  return await Influencer.findByIdAndDelete(id);
};
