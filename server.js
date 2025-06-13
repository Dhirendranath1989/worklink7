// Upload work photos endpoint
app.post('/api/auth/upload-work-photos', upload.array('workPhotos', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const workPhotos = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update work photos
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new work photos to existing ones
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
      await user.save();
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
    }

    res.json({
      message: 'Work photos uploaded successfully',
      workPhotos: user.workPhotos,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading work photos:', error);
    res.status(500).json({ error: 'Failed to upload work photos' });
  }
});

// Upload certificates endpoint
app.post('/api/auth/upload-certificates', upload.array('certificates', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const certificates = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update certificates
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new certificates to existing ones
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
      await user.save();
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
    }

    res.json({
      message: 'Certificates uploaded successfully',
      certificates: user.certificates,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading certificates:', error);
    res.status(500).json({ error: 'Failed to upload certificates' });
  }
});

// Delete work photo endpoint
app.delete('/api/auth/delete-work-photo/:userId/:photoIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, photoIndex } = req.params;
    const index = parseInt(photoIndex);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    // Find user and remove work photo
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.workPhotos || index >= user.workPhotos.length) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      // Remove the photo from array
      const deletedPhoto = user.workPhotos[index];
      user.workPhotos.splice(index, 1);
      await user.save();
      
      // Delete the physical file
      const fs = require('fs');
      const path = require('path');
      if (deletedPhoto.path) {
        const filePath = path.join(__dirname, 'uploads', path.basename(deletedPhoto.path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.workPhotos || index >= user.workPhotos.length) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      // Remove the photo from array
      const deletedPhoto = user.workPhotos[index];
      user.workPhotos.splice(index, 1);
      
      // Delete the physical file
      const fs = require('fs');
      const path = require('path');
      if (deletedPhoto.path) {
        const filePath = path.join(__dirname, 'uploads', path.basename(deletedPhoto.path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    res.json({
      message: 'Work photo deleted successfully',
      workPhotos: user.workPhotos,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error deleting work photo:', error);
    res.status(500).json({ error: 'Failed to delete work photo' });
  }
});

// Delete certificate endpoint
app.delete('/api/auth/delete-certificate/:userId/:certIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, certIndex } = req.params;
    const index = parseInt(certIndex);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid certificate index' });
    }

    // Find user and remove certificate
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.certificates || index >= user.certificates.length) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
      
      // Remove the certificate from array
      const deletedCert = user.certificates[index];
      user.certificates.splice(index, 1);
      await user.save();
      
      // Delete the physical file
      const fs = require('fs');
      const path = require('path');
      if (deletedCert.path) {
        const filePath = path.join(__dirname, 'uploads', path.basename(deletedCert.path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.certificates || index >= user.certificates.length) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
      
      // Remove the certificate from array
      const deletedCert = user.certificates[index];
      user.certificates.splice(index, 1);
      
      // Delete the physical file
      const fs = require('fs');
      const path = require('path');
      if (deletedCert.path) {
        const filePath = path.join(__dirname, 'uploads', path.basename(deletedCert.path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    res.json({
      message: 'Certificate deleted successfully',
      certificates: user.certificates,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});}]}}