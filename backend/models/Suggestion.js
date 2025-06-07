import mongoose from 'mongoose';
const suggestionSchema = new mongoose.Schema({
  category: { type: String, required: true, index: true, lowercase: true },
  type: { type: String, enum: ['question', 'reply'], required: true }, // 'question' for starters
  text: { type: String, required: true, unique: true }, // Ensure unique suggestions
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);
export default Suggestion;
