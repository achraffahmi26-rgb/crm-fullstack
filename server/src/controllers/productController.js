const productService = require('../services/productService');
const { validateCreateProduct, validateUpdateProduct } = require('../validations/productValidation');

async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts();
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch products', error: error.message });
  }
}

async function getProductById(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch product', error: error.message });
  }
}

async function createProduct(req, res) {
  const { errors, isValid } = validateCreateProduct(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    if (req.body.category_id !== undefined && req.body.category_id !== null) {
      const categoryExists = await productService.categoryExists(req.body.category_id);
      if (!categoryExists) {
        return res.status(400).json({ message: 'category_id does not exist' });
      }
    }

    const skuExists = await productService.getSkuByName(req.body.sku);
    if (skuExists) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    if (req.body.barcode) {
      const barcodeExists = await productService.getBarcodeByValue(req.body.barcode);
      if (barcodeExists) {
        return res.status(400).json({ message: 'Barcode already exists' });
      }
    }

    const product = await productService.createProduct(req.body);
    return res.status(201).json({ product });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create product', error: error.message });
  }
}

async function updateProduct(req, res) {
  const { errors, isValid } = validateUpdateProduct(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingProduct = await productService.getProductById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.category_id !== undefined && req.body.category_id !== null) {
      const categoryExists = await productService.categoryExists(req.body.category_id);
      if (!categoryExists) {
        return res.status(400).json({ message: 'category_id does not exist' });
      }
    }

    if (req.body.sku !== undefined) {
      const skuExists = await productService.getSkuByName(req.body.sku, req.params.id);
      if (skuExists) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    if (req.body.barcode !== undefined && req.body.barcode) {
      const barcodeExists = await productService.getBarcodeByValue(req.body.barcode, req.params.id);
      if (barcodeExists) {
        return res.status(400).json({ message: 'Barcode already exists' });
      }
    }

    const product = await productService.updateProduct(req.params.id, req.body);
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update product', error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const existingProduct = await productService.getProductById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await productService.deleteProduct(req.params.id);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete product', error: error.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
