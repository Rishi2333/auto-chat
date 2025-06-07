import connectDB from './db.js';
import Suggestion from './models/Suggestion.js';

const categorizedData = {
  romantic: {
    questions: [
      "Agar humari love story ek movie hoti, toh uska naam kya hota?",
      "Aapko mujhme sabse pehli cheez kya pasand aayi thi?",
      "Perfect date night aapke liye kaisi hogi?",
      "Kaunsa gaana humare rishte ko perfectly describe karta hai?",
      "Sabse yaadgaar pal humara kaunsa tha ab tak?",
    ],
    replies: [
      "Aww, that's so sweet!",
      "Yeh sunkar mera din ban gaya.",
      "Main bhi bilkul yahi soch raha/rahi thi.",
      "Tum kitne thoughtful ho!",
      "I feel the same way.",
    ],
  },
  food: {
    questions: [
      "Aisi kaunsi dish hai jo aap roz kha sakte ho?",
      "Sabse ajeeb cheez kya try ki hai aapne khane mein?",
      "Sweet ya Spicy? Aap kya prefer karte ho?",
      "Ghar ka khana ya bahar ka?",
      "Kaunsi ek cheez hai jo aap kabhi nahi khaoge?",
    ],
    replies: [
      "Wow, foodie alert!",
      "Mere muh mein paani aa gaya!",
      "Humein yeh zaroor saath mein try karna chahiye.",
      "That sounds delicious!",
      "I'm always up for food adventures.",
    ],
  },
  gardening: {
    questions: [
      "Aapka favourite plant kaunsa hai aur kyun?",
      "Indoor plants zyada pasand hain ya outdoor?",
      "Kya aapne kabhi khud ki sabziyan ugayi hain?",
      "Gardening ka sabse rewarding part kya lagta hai?",
      "Aapka dream garden kaisa hoga?",
    ],
    replies: [
      "Nature ke kareeb rehna kitna accha lagta hai na?",
      "That's so calming and therapeutic.",
      "Mujhe bhi gardening seekhni hai.",
      "Plants make any space beautiful.",
      "It's amazing to watch things grow.",
    ],
  },
  singing: {
    questions: [
      "Aapka go-to karaoke song kaunsa hai?",
      "Aap kis singer ki concert mein jaana chahoge?",
      "Bathroom singer ho ya stage performer?",
      "Agar aap ek band shuru karte, toh uska naam kya hota?",
      "Gaana sunte waqt aapko kaisa feel hota hai?",
    ],
    replies: [
      "Kya baat hai, aapki awaaz sunni padegi!",
      "Music is life!",
      "Yeh gaana toh mera bhi favourite hai.",
      "That's a great choice of song.",
      "Let's have a jam session sometime!",
    ],
  },
  general: { // Yeh replies tab use honge jab specific category mein kam replies hon
    questions: [ // General starters, if no category is picked or for more variety
        "Aaj ka din kaisa jaa raha hai?",
        "Koi nayi cheez seekhi haal hi mein?",
        "Agar ek superpower milta, toh kaunsa chunte?",
    ],
    replies: [
      "Interesting! Iske baare mein aur batao.",
      "Haha, seriously?",
      "Main samajh sakta/sakti hoon.",
      "Uske baad kya hua?",
      "Yeh ek accha point hai.",
      "That's cool.",
      "I agree.",
      "Tell me more.",
    ],
  },
};

const seedSuggestions = async () => {
  await connectDB();
  try {
    console.log('Attempting to clear old suggestions...');
    await Suggestion.deleteMany({});
    console.log('Old suggestions cleared.');

    const suggestionsToInsert = [];

    for (const [category, data] of Object.entries(categorizedData)) {
      if (data.questions) {
        data.questions.forEach(q => {
          suggestionsToInsert.push({ category: category.toLowerCase(), type: 'question', text: q });
        });
      }
      if (data.replies) {
        data.replies.forEach(r => {
          suggestionsToInsert.push({ category: category.toLowerCase(), type: 'reply', text: r });
        });
      }
    }
    if (suggestionsToInsert.length > 0) {
      await Suggestion.insertMany(suggestionsToInsert, { ordered: false }).catch(err => {
        if (err.code === 11000) { // Duplicate key error
          console.warn("Some duplicate suggestions were ignored during seeding.");
        } else {
          throw err;
        }
      });
      console.log(`✅ ${suggestionsToInsert.length} Categorized Suggestions processed for seeding! Check DB for final count.`);
    } else {
        console.log("No new suggestions to seed.");
    }
    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedSuggestions();