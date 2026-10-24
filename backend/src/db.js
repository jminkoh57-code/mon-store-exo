import mongoose from "mongoose";

async function connectDb() {
  const uri = process.env.MONGO_URI ?? "mongodb://mongo:27017/todos";

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await mongoose.connect(uri);
      return;
    } catch (error) {
      if (attempt === 30) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export { connectDb };
