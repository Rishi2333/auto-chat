import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  roomId: { type: String, ref: 'Room', required: true, index: true },
  senderId: { type: String, required: true }, // socket.id of the sender
  text: { type: String, required: true },
}, { timestamps: true });
const Message = mongoose.model('Message', messageSchema);
export default Message;