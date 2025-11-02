
import mongoose from "mongoose";
const URI =
  "mongodb+srv://monitor:atulhim4325b@cluster0.mf3uuao.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(URI);
    console.log(
      `Database connected on connection host => ${conn.connection.host}`
    );
    console.log("DB CONNECTED SUCCESSFULLY");
  } catch (error) {
    console.log(`Error connecting to database =>`, error);
    process.exit(1); // exit with failure
  }
};
