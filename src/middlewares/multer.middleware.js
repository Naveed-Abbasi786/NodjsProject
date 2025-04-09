// import multer from "multer"

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/temp')
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//       cb(null, file.fieldname + '-' + uniqueSuffix)
//     }
//   })
  
// export  const upload = multer({ storage: storage })

import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp'); // Temp folder where images are stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get the file extension based on the mime type
    const fileExtension = file.mimetype.split('/')[1]; // 'png', 'jpeg', 'jpg'
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension); // Add extension to the file name
  }
});

export const upload = multer({ storage: storage });
