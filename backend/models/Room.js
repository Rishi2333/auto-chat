import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  // Yeh room ka unique ID hai jo frontend se aata hai
  _id: { type: String, required: true },
  
  // Is array mein un pehle do users ke permanent userId store honge
  // jinhone room banaya tha. Yeh "Room Lock" feature ke liye hai.
  participants: [{ 
    type: String, 
    required: true 
  }],

  // Yeh array current online users ke temporary socket.id store karega
  users: [{ type: String }], 
  
  // Jiska turn hai, uska socket.id yahan store hoga
  activeUser: { type: String, default: null },
  
  // Select ki hui category ka naam
  category: { type: String },
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
