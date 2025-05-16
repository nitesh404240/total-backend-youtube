// Import Cloudinary's v2 API and Node's file system module
import { v2 as Cloudinary } from "cloudinary";
import fs from "fs";

//Cloudinary expects a file path or stream. So multer → disk → Cloudinary is a common pattern.

// ===================== Cloudinary Configuration ======================
// This sets up your Cloudinary connection using environment variables
// These values should be in your `.env` file to keep them secret
Cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,     // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,           // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET      // Your Cloudinary API secret
});

// ===================== File Upload Handler ===========================
// This function takes a local file path (temp file on server) and uploads it to Cloudinary
// It returns the Cloudinary response if successful, or null if failed
const uploadOncloudinary = async (localFilePath) => {
  try {
    // If no file path is provided, return early
    if (!localFilePath) return null;

    // Upload the file from the local file system to Cloudinary
    // resource_type: "auto" automatically detects if it's an image, video, etc.
    const response = await Cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    // If successful, log and return the Cloudinary upload response
    console.log("✅ File has been uploaded successfully", response, response.url);
    return response;

  } catch (error) {
    // ⚠️ This block runs if the Cloudinary upload fails due to:
    // - Network errors
    // - API limits
    // - Corrupt files
    // - Invalid credentials

    console.error("❌ Upload to Cloudinary failed:", error);

    // 🔥 Cleanup: Remove the temporary file from the server to free up disk space
    // Even if upload fails, this file is no longer needed
    // Prevents storage buildup if many uploads fail
    fs.unlinkSync(localFilePath);

    // Return null so calling code knows the upload failed
    return null;
  }
};

// ===================== Example (Manual Upload) ========================
// This example shows how you might call Cloudinary's uploader manually for videos
// It includes options like setting a public ID, overwriting existing files,
// and sending a webhook on upload completion
/*
Cloudinary.uploader.upload("dog.mp4", {
  resource_type: "video",                      // Force it to treat file as a video
  public_id: "my_dog",                         // Custom name in your Cloudinary account
  overwrite: true,                             // Replace file if public_id already exists
  notification_url: "https://mysite.com/notify" // Cloudinary will notify this URL when done
}).then(result => console.log(result));
*/

// Export the function so other modules can use it
export { uploadOncloudinary };

//this is how my respnse look like 
// {
//   asset_id: '9dfeb631abc123',
//   public_id: 'your_folder/video_file123',
//   version: 1715889087,
//   version_id: 'abcxyz123',
//   signature: 'fakesignature',
//   width: 1920,
//   height: 1080,
//   format: 'mp4',
//   resource_type: 'video',
//   created_at: '2025-05-16T12:31:27Z',
//   tags: [],
//   bytes: 15000000,
//   type: 'upload',
//   etag: 'e5a0c8fa59e8',
//   placeholder: false,
//   url: 'http://res.cloudinary.com/yourcloud/video/upload/v1715889087/your_folder/video_file123.mp4',
//   secure_url: 'https://res.cloudinary.com/yourcloud/video/upload/v1715889087/your_folder/video_file123.mp4',
//   original_filename: 'video_file123'
// }

