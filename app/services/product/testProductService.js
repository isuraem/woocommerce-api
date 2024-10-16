const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed
const axios = require('axios');
const he = require('he');

module.exports.getProduct = async () => {
    try {

        const orderwiseProductDetails = await getTenProductsWithVariants();

        const woocommerceProductsDetails = await getProductsFromWoocommerce();

        console.log("orderwise data length: ", orderwiseProductDetails.length)
        console.log("woocommerce data length: ", woocommerceProductsDetails.length)
        const productDetails = await compareMismatchedProducts(orderwiseProductDetails,woocommerceProductsDetails);

        console.log("length of products: ",productDetails)

        return {
            msg: 'Successfully get order details',
            data: productDetails
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get order details');
    }
};

async function getTenProductsWithVariants() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/66`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        // Assuming productDetails.data contains an array of products with potential variants
        const products = productDetails.data;

        // Group variants under their main product by 'productId' or similar unique identifier
        const productMap = new Map();
        products.forEach(product => {
            const productId = product.pd_id; // Use the appropriate unique product identifier
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    mainProduct: product, // or however you want to represent the main product
                    variants: [product] // Initialize variants array with the product itself
                });
            } else {
                productMap.get(productId).variants.push(product); // Add variant to the existing product
            }
        });

        // Get the first 10 unique products and their variants
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 4);
        console.log("length :", first10UniqueProducts[0].variants.length)
        return first10UniqueProducts

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
}

async function getProductsFromWoocommerce(){
    try {
        let allProducts = [];
        let page = 1;
        let perPage = 100;
        let totalPages = 1; // Initial value, will be updated after the first request

        // Make an initial request to get the total number of pages
        const initialResponse = await WooCommerce.get("products", {
            params: {
                per_page: perPage,
                page: page
            }
        });

        totalPages = parseInt(initialResponse.headers['x-wp-totalpages'], 10); // WooCommerce returns total pages in this header
        allProducts = allProducts.concat(initialResponse.data);

        // Create an array of promises for the remaining pages
        const requests = [];
        for (let i = 2; i <= totalPages; i++) {
            requests.push(WooCommerce.get("products", {
                params: {
                    per_page: perPage,
                    page: i
                }
            }));
        }

        // Fetch all pages in parallel
        const responses = await Promise.all(requests);

        // Concatenate all products from the responses
        responses.forEach(response => {
            allProducts = allProducts.concat(response.data);
        });

        console.log(allProducts.length); // Log the total number of products

        return allProducts;

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to retrieve products');
    }
};
async function compareMismatchedProducts(orderwiseProducts, woocommerceProducts) {
    try {
        // Extract WooCommerce product SKUs and map them to the 'pd_id' format (as strings)
        const wooCommercePdIds = [...new Set(woocommerceProducts
            .map(product => {
                // Check if the SKU exists and is not null
                if (product.sku && typeof product.sku === 'string') {
                    const skuParts = product.sku.split('_');
                    if (skuParts.length === 3) {
                        return skuParts[1]; // The 'pd_id' part of the SKU
                    }
                }
                return null;
            })
            .filter(pdId => pdId !== null))]; // Remove duplicates using Set and convert it back to an array

        console.log("Unique WooCommerce pd_ids:", wooCommercePdIds); // Log WooCommerce pd_ids

        // Filter out matched OrderWise products
        const remainingOrderwiseProducts = orderwiseProducts.filter(orderwiseProduct => {
            const orderwisePdId = String(orderwiseProduct.mainProduct.pd_id); // Convert pd_id to string
            
            // Log the comparison status
            const isMatched = wooCommercePdIds.includes(orderwisePdId);

            return !isMatched;
        });

        return remainingOrderwiseProducts; // Return only unmatched products

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to compare products');
    }
}

module.exports.getManyProductInOrderwise = async () => {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/66`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log("product length :", productDetails.data.length)

        // Assuming productDetails.data contains an array of products with potential variants
        const products = productDetails.data;

        // Group variants under their main product by 'productId' or similar unique identifier
        const productMap = new Map();
        products.forEach(product => {
            const productId = product.pd_id; // Use the appropriate unique product identifier
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    mainProduct: product, // or however you want to represent the main product
                    variants: [product] // Initialize variants array with the product itself
                });
            } else {
                productMap.get(productId).variants.push(product); // Add variant to the existing product
            }
        });

        // Get the first 10 unique products and their variants
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 10);
        console.log("length :", first10UniqueProducts[0].variants.length)
        return {
            msg: 'Successfully retrieved first 10 unique products with variants',
            data: first10UniqueProducts
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
};