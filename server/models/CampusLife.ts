import mongoose from 'mongoose';

const ClassPhotoSchema = new mongoose.Schema({
  year: { type: String, required: true },
  section: { type: String, required: true },
  photoUrl: { type: String, required: true },
});

const AchievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'Academic', 'Sports', 'Talent'
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
});

const CampusGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true }, // 'Media Guild', 'Sports Team', 'Tamil Mandram'
  members: [{
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, required: true },
  }]
});

export const ClassPhoto = mongoose.model('ClassPhoto', ClassPhotoSchema);
export const Achievement = mongoose.model('Achievement', AchievementSchema);
export const CampusGroup = mongoose.model('CampusGroup', CampusGroupSchema);
