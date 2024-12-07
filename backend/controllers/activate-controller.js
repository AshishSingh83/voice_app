const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const userService = require("../services/user-service");
const UserDto = require("../dtos/user-dto");
class ActivateController {
  async activate(req, res) {
    const { name, avatar } = req.body;

    // Validate input
    if (!name || !avatar) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Validate avatar Base64 format
    if (!avatar.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid avatar format!" });
    }

    // Extract and validate image MIME type
    const supportedFormats = ["png", "jpeg", "jpg"];
    const mimeTypeMatch = avatar.match(/^data:image\/(.*);base64,/);
    if (!mimeTypeMatch || !supportedFormats.includes(mimeTypeMatch[1])) {
      return res
        .status(400)
        .json({
          message: `Unsupported image format: ${
            mimeTypeMatch ? mimeTypeMatch[1] : "unknown"
          }`,
        });
    }

    // Check image size limit
    const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
    const imageBase64 = avatar.split(",")[1];
    if (Buffer.byteLength(imageBase64, "base64") > MAX_IMAGE_SIZE) {
      return res.status(400).json({ message: "Image size exceeds 8MB limit!" });
    }

    // Convert Base64 to Buffer
    const buffer = Buffer.from(imageBase64, "base64");

    // Generate unique filename for the image
    const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${
      mimeTypeMatch[1]
    }`;

    // Ensure storage directory exists
    const storageDir = path.resolve(__dirname, "../storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Process and save the image using Sharp
    try {
      await sharp(buffer)
        .resize(150) // Resize the image to 150px width, auto height
        .toFile(path.resolve(storageDir, imagePath));
    } catch (err) {
      console.error("Sharp Error:", err);
      return res
        .status(500)
        .json({ message: "Could not process the image", error: err.message });
    }

    // Validate `req.user`
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const userId = req.user._id;

    // Update user data
    try {
      const user = await userService.findUser({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }

      user.activated = true;
      user.name = name;
      user.avatar = `/storage/${imagePath}`;

      try {
        await user.save();
      } catch (err) {
        console.error("User Save Error:", err);
        return res.status(500).json({ message: "Failed to update user!" });
      }

      // Respond with updated user data
      res.json({ user: new UserDto(user), auth: true });
    } catch (err) {
      console.error("User Update Error:", err);
      res.status(500).json({ message: "Something went wrong!" });
    }
  }
}
module.exports = new ActivateController();
