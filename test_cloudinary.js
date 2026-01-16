const pkg = require("multer-storage-cloudinary");
console.log("Type:", typeof pkg);
console.log("Keys:", Object.keys(pkg));
try {
    console.log("CloudinaryStorage Type:", typeof pkg.CloudinaryStorage);
} catch (e) { }
console.log("Full Export:", JSON.stringify(pkg, null, 2));
