import mongoose from 'mongoose';
const roomSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom room ID (UUID from frontend)
  users: [{ type: String }], // Array of socket.id
  activeUser: { type: String, default: null },
  category: { type: String },
}, { timestamps: true });
const Room = mongoose.model('Room', roomSchema);
export default Room;