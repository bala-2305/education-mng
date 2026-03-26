import express from 'express';
import { ClassPhoto, Achievement, CampusGroup } from '../models/CampusLife';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all class photos
router.get('/photos', async (req, res) => {
  try {
    const photos = await ClassPhoto.find();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update class photo
router.post('/photos', authenticate, async (req, res) => {
  try {
    const { year, section, photoUrl } = req.body;
    let photo = await ClassPhoto.findOne({ year, section });
    if (photo) {
      photo.photoUrl = photoUrl;
      await photo.save();
    } else {
      photo = new ClassPhoto({ year, section, photoUrl });
      await photo.save();
    }
    res.json(photo);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create achievement
router.post('/achievements', authenticate, async (req, res) => {
  try {
    const achievement = new Achievement(req.body);
    await achievement.save();
    res.json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update achievement
router.put('/achievements/:id', authenticate, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete achievement
router.delete('/achievements/:id', authenticate, async (req, res) => {
  try {
    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Achievement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all campus groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await CampusGroup.find();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update campus group
router.post('/groups', authenticate, async (req, res) => {
  try {
    const { groupName, members } = req.body;
    let group = await CampusGroup.findOne({ groupName });
    if (group) {
      group.members = members;
      await group.save();
    } else {
      group = new CampusGroup({ groupName, members });
      await group.save();
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
