const cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.SECRET_KEY
});

const cloudinaryUploadImg = (fileToUploads) => {
  return cloudinary.uploader.upload(fileToUploads, { resource_type: "auto" });
};

const cloudinaryDeleteImg = (fileToDelete) => {
  return cloudinary.uploader.destroy(fileToDelete, { resource_type: "auto" });
};

module.exports = { cloudinaryUploadImg, cloudinaryDeleteImg };
