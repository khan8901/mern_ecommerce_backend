const Product = require("../models/product");

const cloudinary = require("cloudinary");
const user = require("../models/user");

cloudinary.config({
  cloud_name: "dzpqal87c",
  api_key: "937163133516412",
  api_secret: "xY7Nhgic_n-FkVfLJAfikAqGf38",
});

const uploadImagesToCloudinary = async (images) => {
  const uploadedUrls = [];

  for (const image of images) {
    const result = await cloudinary.uploader.upload(image, {
      folder: "anokha",
    });
    uploadedUrls.push(result.secure_url);
  }

  return uploadedUrls;
};
// Create new product   =>   /api/v1/admin/product/new
exports.newProduct = async (req, res) => {
  try {
    const { name, price, description, category, seller, stock, user } =
      req.body;

    console.log(name, price, description, category, seller, stock, user);

    ///Upload images to Cloudinary and obtain their URLs
    /*    const uploadPromises = images.map((image) =>
        cloudinary.uploader.upload(image)
      );
      const uploadedImages = await Promise.all(uploadPromises);
      const imageUrls = uploadedImages.map((image) => image.secure_url);
    */

    const { images } = req.body;
    console.log(images, " these are images");
    const uploadedUrls = await uploadImagesToCloudinary(images);

    const product = new Product({
      name,
      price,
      description,
      category,
      seller,
      stock,
      images: uploadedUrls,
      user,
    });

    const createdProduct = await product.save();

    res.status(201).json({
      success: true,
      product: createdProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all products   =>   /api/v1/products?keyword=apple
exports.getProducts = async (req, res) => {
  const { name, categories, minPrice, maxPrice, page, limit } = req.query;

  const filters = {};

  if (name) {
    filters.name = { $regex: name, $options: "i" };
  }

  if (categories) {
    filters.category = { $in: categories.split(",") };
  }

  if (minPrice && maxPrice) {
    filters.price = { $gte: minPrice, $lte: maxPrice };
  }

  try {
    const totalProducts = await Product.countDocuments(filters);

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const totalPages = Math.ceil(totalProducts / pageSize);

    const products = await Product.find(filters)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      products,
      currentPage,
      pageSize,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all products (Admin)  =>   /api/v1/admin/products
exports.getAdminProducts = async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
};

// Get single product details   =>   /api/v1/product/:id
exports.getSingleProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
};

// Update Product   =>   /api/v1/admin/product/:id

exports.updateProduct = async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(("Product not found", 404));
  }

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting images associated with the product
    for (let i = 0; i < product.images.length; i++) {
      const result = await cloudinary.v2.uploader.destroy(
        product.images[i].public_id
      );
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
};

// Delete Product   =>   /api/v1/admin/product/:id
exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(("Product not found", 404));
  }

  // Deleting images associated with the product
  // for (let i = 0; i < product.images.length; i++) {
  //     const result = await cloudinary.v2.uploader.destroy(product.images[i].public_id)
  // }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product is deleted.",
  });
};

// Create new review   =>   /api/v1/review
exports.createProductReview = async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
};

// Get Product Reviews   =>   /api/v1/reviews
exports.getProductReviews = async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
};

// Delete Product Review   =>   /api/v1/reviews
exports.deleteReview = async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  const reviews = product.reviews.filter(
    (review) => review._id.toString() !== req.query.id.toString()
  );

  const numOfReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
};

exports.sellerProducts = async (req, res, next) => {
  try {
    const perPage = 10;

    const page = req.params.page ? req.params.page : 1;

    const sellerProducts = await Product.find({ user: req.user.id })
      .skip((page - 1) * perPage)
      .sort({ createdAt: -1 })
      .limit(perPage);

    res.status(200).json({
      success: true,
      sellerProducts,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.productliked = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.body.productId,
      {
        $addToSet: { likes: req.user.id },
      },
      { new: true }
    );

    res.json(product);
    console.log(product.likes, " these are product likes");
  } catch (err) {
    console.log(err);
  }
};

exports.productunliked = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.body.productId,
      {
        $pull: { likes: req.user.id },
      },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.log(err);
  }
};

exports.productviewed = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.json({ ok: true });

    console.log(product.views, " this is length");
  } catch (err) {
    console.log(err);
  }
};

// Search products by category, name, and price with pagination
exports.searchProducts = async (req, res, next) => {
  try {
    let query = {};

    // Category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Name
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: "i" }; // Case insensitive search
    }

    // Price
    if (req.query.price) {
      query.price = req.query.price;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query).limit(limit).skip(startIndex);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getProductsnew = async (req, res, next) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments();

    const products = await Product.find().limit(limit).skip(startIndex);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
