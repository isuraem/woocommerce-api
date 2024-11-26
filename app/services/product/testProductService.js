const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed
const axios = require('axios');
const he = require('he');

module.exports.getProduct = async () => {
    try {
        const woocommerceProductsDetails = await getProductsFromWoocommerce();

        console.log("length of products: ",woocommerceProductsDetails)

        return {
            msg: 'Successfully get order details',
            data: woocommerceProductsDetails
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

async function getProductsWithVariantsOw() {
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
            const orderwisePdId = String(orderwiseProduct.pd_id); // Convert pd_id to string
            
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

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/70`, data, {
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
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 1);
        const option1Values = getOptionValuesByName(first10UniqueProducts[0].variants, 'option_name_1');

        console.log("values :", option1Values)
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

const getOptionValuesByName = (variants, optionKey) => {
    return variants
        .map(variant => variant[optionKey])  // Map each variant to the specified option key
        .filter(option => option !== null);  // Filter out null values
};


module.exports.createSaleOrderToOW = async (requestBody) => {
    try {

        console.log("data", requestBody)
        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/sales/order`, requestBody, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        return {
            msg: 'Successfully get order details',
            data: productDetails.data
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

module.exports.getTenSimpleProductOW = async () => {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/68`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        const firstTenProducts = productDetails.data.slice(0, 10);
        console.log("data", firstTenProducts.length)

        return {
            msg: 'Successfully retrieved first 10 product details',
            data: firstTenProducts
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


async function getSimpleProductOWNew(){
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/68`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        const firstTenProducts = productDetails.data.slice(0, 10);

        return firstTenProducts
            

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
};

// module.exports.getProductsAndVariantsFromWoocommerce = async () => {
//     try {
//         let allProducts = [];
//         let page = 1;
//         let perPage = 100;
//         let totalPages = 1;

//         // Make an initial request to get the total number of pages
//         const initialResponse = await WooCommerce.get("products", {
//             params: {
//                 per_page: perPage,
//                 page: page
//             }
//         });

//         totalPages = parseInt(initialResponse.headers['x-wp-totalpages'], 10); // WooCommerce returns total pages in this header
//         allProducts = allProducts.concat(initialResponse.data);

//         // Fetch all the products by paging through the API
//         const requests = [];
//         for (let i = 2; i <= totalPages; i++) {
//             requests.push(WooCommerce.get("products", {
//                 params: {
//                     per_page: perPage,
//                     page: i
//                 }
//             }));
//         }

//         const responses = await Promise.all(requests);
//         responses.forEach(response => {
//             allProducts = allProducts.concat(response.data);
//         });

//         // Array to store products with their variants
//         const productsWithVariants = [];
//         console.log("length: ",allProducts.length)
//         // Fetch variants for each product and add them to the products array
//         for (const product of allProducts) {
//             let variants = [];
//             console.log("type: ",product.type)
//             // If the product is a variable product, fetch its variants
//             if (String(product.type) === 'variable') {
//                 console.log(`Product ID ${product.id} is a variable product`);
//                 const variantResponse = await WooCommerce.get(`products/${product.id}/variations`, {
//                     params: {
//                         per_page: perPage
//                     }
//                 });
//                 variants = variantResponse.data;
//             }

//             // Push the product and its variants into the result array
//             productsWithVariants.push({
//                 mainProduct: product,
//                 variants: variants
//             });
//         }

//         return {
//             msg: 'Successfully retrieved product details',
//             data: productsWithVariants
//         };

//     } catch (error) {
//         if (error.response && error.response.data) {
//             console.error(error.response.data);
//         } else {
//             console.error(error);
//         }
//         throw new Error('Failed to retrieve products and variants');
//     }
// }
module.exports.getProductsAndVariantsFromWoocommerce = async () => {
    const allProducts = [];
    let productsWithVariants = [];
    let page = 1;
    let totalPages = 1;

    try {
        // Fetch products page by page with retry logic
        while (page <= totalPages) {
            const productResponse = await fetchWithRetry("products", {
                per_page: 100,  // Fetch up to 100 products per page
                page: page      // Set current page
            });

            const products = productResponse.data;
            totalPages = parseInt(productResponse.headers['x-wp-totalpages'], 10);  // Get total pages from headers

            // Append current page products to allProducts
            allProducts.push(...products);

            // Move to the next page
            page++;
        }

        console.log("Total products fetched:", allProducts.length);

        // Process each product to fetch its variants if it's a variable product
        for (const product of allProducts) {
            let variants = [];
            console.log("type: ", product.type);

            try {
                // If the product is a variable product, fetch its variants
                if (String(product.type) === 'variable') {
                    console.log(`Product ID ${product.id} is a variable product`);

                    const variantResponse = await fetchWithRetry(`products/${product.id}/variations`, {
                        per_page: 100 // Fetch up to 100 variations per page, adjust as needed
                    });

                    variants = variantResponse.data;
                }
            } catch (variantError) {
                console.error(`Error fetching variants for product ID ${product.id}:`, variantError.response ? variantError.response.data : variantError.message);
            }

            // Push the product and its variants into the result array
            productsWithVariants.push({
                mainProduct: product,
                variants: variants
            });
        }

        return {
            msg: 'Successfully retrieved products and variants',
            data: productsWithVariants
        };
    } catch (error) {
        console.error("Error fetching products with variants:", error.response ? error.response.data : error.message);
        return {
            msg: 'Failed to retrieve products and variants',
            error: error.response ? error.response.data : error.message
        };
    }
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1000) {
    try {
        const response = await WooCommerce.get(url, options);
        return response;
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 502) {
            console.error(`Temporary error: ${error.message}. Retrying in ${delayMs}ms...`);
            await delay(delayMs);
            return fetchWithRetry(url, options, retries - 1, delayMs * 2);  // Retry with increased delay
        } else {
            throw error;  // Throw error after exhausting retries
        }
    }
}


module.exports.editMetaData = async (req) => {
    try {
        // Extract productId and owSkuValue from the request body
        const { productId, owSkuValue } = req.body;

        // Ensure both values are provided
        if (!productId || !owSkuValue) {
            throw new BadRequestException('Product ID and ow_sku value are required');
        }

        // Update the product's metadata with the `ow_sku` key and provided value
        const response = await WooCommerce.put(`products/${productId}`, {
            meta_data: [
                {
                    key: 'ow_sku',
                    value: owSkuValue
                }
            ]
        });

        return {
            msg: `Successfully updated product ${productId} with ow_sku`,
            data: response.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException(`Failed to update product ${productId} metadata`);
    }
};

//----------------------------------------------------------------------------------

// junk functions on original productService.js

async function addingAttributesTerms(options, attributeId) {
    for (const option of options) {
        let data = {
            name: option
        };

        try {
            let response = await WooCommerce.post(`products/attributes/${attributeId}/terms`, data);
            console.log("Term added:", option);
        } catch (error) {
            try {
                // Delete the attribute if adding a term fails
                await WooCommerce.delete(`products/attributes/${attributeId}`);
                console.error(`Failed to add term: ${option}`);

                if (error.response && error.response.data) {
                    console.error(error.response.data);
                } else {
                    console.error(error);
                }
                throw new BadRequestException('Failed to add terms');
            } catch (deleteError) {
                console.error("Failed to delete attribute:", deleteError);
            }
        }
    }
}

// async function findMismatchedCategories(wooCommerceCategories, categoriesDetails) {
//     const mismatches = [];
//     let matchesCount = 0;

//     // Check if both inputs are arrays
//     if (!Array.isArray(wooCommerceCategories) || !Array.isArray(categoriesDetails)) {
//         throw new BadRequestException("Either wooCommerceCategories or categoriesDetails is not an array");
//     }

//     for (const prod of categoriesDetails) {
//         console.log(`\n=== Checking Product: ${prod.ctn_description} ===`);
//         const prodDescription = (prod.ctn_description).trim().toLowerCase();
//         const matchedCategory = wooCommerceCategories.find(category => {

//             const categoryName = (category.name).trim().toLowerCase();
//             // Check if the category name matches the product description
//             const categoryMatches = categoryName.includes(prodDescription);

//             // If category doesn't match, return false immediately
//             if (!categoryMatches) return false;

//             // Check if parent name exists on both and match
//             if (category.parent_name && prod.parent_description) {
//                 console.log("on parent name qualty cat ID: ",category.id )
//                 const categoryParentName = category.parent_name.trim().toLowerCase();
//                 const prodParentDescription = prod.parent_description.trim().toLowerCase();

//                 // Check if parent name matches
//                 const categoryParentMatches = categoryParentName.includes(prodParentDescription);

//                 if (!categoryParentMatches) {
//                     return false;  // Parent name doesn't match
//                 }
//             } else if (category.parent_name || prod.parent_description) {
//                 // If one has a parent name and the other doesn't, it's a mismatch
//                 return false;
//             }

//             return true;  // All conditions match
//         });

//         if (matchedCategory) {
//             matchesCount++;
//         } else {
//             // If no matching category found, add the product to mismatches
//             mismatches.push(prod);
//         }
//     }


//     console.log("Total matches found:", matchesCount);
//     return mismatches;  // Return the list of mismatched categories
// }

async function findParentCategory(wooCommerceCategories, parentCategoryName) {
    let mismatches = null;

    // Check if wooCommerceCategories is an array
    if (Array.isArray(wooCommerceCategories)) {
        const matchedCategory = wooCommerceCategories.find(category => {
            const catName = category.name.trim().toLowerCase();
            const parentName = parentCategoryName.trim().toLowerCase();

            return catName.includes(parentName);
        });

        if (matchedCategory) {
            console.log(`Match found: ${matchedCategory.name} with ID: ${matchedCategory.id}`);
            mismatches = matchedCategory.id;
        } else {
            console.log(`No match found for: ${parentCategoryName}`);
        }
    } else {
        throw new BadRequestException("wooCommerceCategories is not an array");
    }

    return mismatches;
}

// async function findParentWithObjCategory(wooCommerceCategories, parentCategory) {
//     // Check if wooCommerceCategories is an array
//     if (Array.isArray(wooCommerceCategories)) {
//         for (const category of wooCommerceCategories) {
//             const catName = category.name.trim().toLowerCase();
//             const parentName = parentCategory.ctn_description.trim().toLowerCase();
//             console.log("matching names parent: ", catName)
//             if (catName.includes(parentName)) {
//                 // Check if the matched category has a parent name
//                 if (category.parent_name && parentCategory.parent_description) {
//                     const categoryParentName = category.parent_name.trim().toLowerCase();
//                     const prodParentDescription = parentCategory.parent_description.trim().toLowerCase();

//                     // Check if parent name matches
//                     const categoryParentMatches = categoryParentName.includes(prodParentDescription);
//                     if (categoryParentMatches) {
//                         console.log("matched : ", category.id)
//                         return category.id; // Return the first matched category ID
//                     }
//                 }
//                 else{
//                     return category.id;
//                 }
//             }
//         }

//         console.log(`No matches found for: ${parentCategory.ctn_description}`);
//     } else {
//         throw new BadRequestException("wooCommerceCategories is not an array");
//     }

//     return null; // Return null if no match is found
// }

// async function findParentWithObjCategory(wooCommerceCategories, parentCategory) {
//     let mismatches = null;

//     // Check if wooCommerceCategories is an array
//     if (Array.isArray(wooCommerceCategories)) {
//         const matchedCategory = wooCommerceCategories.find(category => {
//             const catName = category.name.trim().toLowerCase();
//             const parentName = parentCategory.ctn_description.trim().toLowerCase();

//             return catName.includes(parentName);
//         });

//         if (matchedCategory) {
//             console.log(`Match found: ${matchedCategory.name} with ID: ${matchedCategory.id}`);
//             if (category.parent_name && prod.parent_description) {
//                 const categoryParentName = category.parent_name.trim().toLowerCase();
//                 const prodParentDescription = parentCategory.parent_description.trim().toLowerCase();

//                 // Check if parent name matches
//                 const categoryParentMatches = categoryParentName.includes(prodParentDescription);
//                 if(categoryParentMatches){
//                     mismatches = matchedCategory.id;
//                     return
//                 }
//             }

//         } else {
//             console.log(`No match found for: ${parentCategoryName}`);
//         }
//     } else {
//         throw new BadRequestException("wooCommerceCategories is not an array");
//     }

//     return mismatches;
// }

// async function fetchCategoriesWithParentNames() {
//     await delay(6000);
//     const allCategories = [];
//     let page = 1;
//     let totalPages = 1; // Default to 1, but will update after first request

//     try {
//         // Fetch the categories page by page
//         while (page <= totalPages) {
//             const categoryResponse = await WooCommerce.get("products/categories", {
//                 per_page: 100,  // Fetch 100 categories per page (WooCommerce limit)
//                 page: page      // Set current page
//             });

//             const categories = categoryResponse.data;
//             totalPages = parseInt(categoryResponse.headers['x-wp-totalpages'], 10);  // Get total pages from headers

//             // Fetch parent category names if needed
//             for (const category of categories) {
//                 if (category.parent !== 0) {
//                     // Fetch parent category by ID
//                     const parentResponse = await WooCommerce.get(`products/categories/${category.parent}`);
//                     category.parent_name = parentResponse.data.name;  // Attach parent category name
//                 } else {
//                     category.parent_name = null;  // No parent, top-level category
//                 }
//             }

//             // Append current page categories to allCategories
//             allCategories.push(...categories);

//             // Move to the next page
//             page++;
//             await delay(1000);
//         }

//         // console.log("All categories with parent names:", allCategories);
//         console.log("category count: ", allCategories.length)
//         return allCategories;
//     } catch (error) {
//         console.error("Error fetching categories with parent names:", error.response ? error.response.data : error.message);
//     }
// }

async function getTermsFromWoocommerce(attributeId) {
    try {
        const allTerms = [];
        const perPage = 100;
        let page = 1;

        // Initial request to get total pages and the first set of terms
        const initialResponse = await fetchWithRetry(`products/attributes/${attributeId}/terms`, {
            per_page: perPage,
            page: page
        });

        // Check for total pages from headers if available
        const totalPages = parseInt(initialResponse.headers['x-wp-totalpages'], 10);
        allTerms.push(...initialResponse.data);

        // Create an array of page numbers to fetch in parallel
        const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

        // Fetch remaining pages in parallel with retry logic
        const requests = pageNumbers.map(pageNum =>
            fetchWithRetry(`products/attributes/${attributeId}/terms`, { per_page: perPage, page: pageNum })
        );

        // Await all responses and gather terms data
        const responses = await Promise.all(requests);
        responses.forEach(response => allTerms.push(...response.data));

        console.log(`Total terms fetched for attribute ${attributeId}:`, allTerms.length);
        return allTerms;

    } catch (error) {
        if (error.response && error.response.data) {
            console.error("API Response Error:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
        throw new Error(`Failed to retrieve terms for attribute ${attributeId}`);
    }
}