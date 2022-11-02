import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const client = () => {
  mongoose.connection.on('Error on connection', (error) => log('Mogoose error', error));
  return mongoose.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  });
}

export default client;