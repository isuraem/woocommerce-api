const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed
const axios = require('axios');
const he = require('he');

module.exports.addProduct = async (requestBody) => {
    try {
        const {
            name,
            type,
            regular_price,
            description,
            short_description,
            categories,
            images,
            attributes,
            variations,
            stock_status,
            manage_stock,
            stock_quantity
        } = requestBody;

        let data = {
            name: name,
            type: type,
            regular_price: regular_price,
            description: description,
            short_description: short_description,
            categories: categories,
            images: images,
            attributes: attributes,
            variations: variations,
            stock_status: stock_status,
            manage_stock: manage_stock ? manage_stock : false,
            stock_quantity: stock_quantity ? stock_quantity : 0
        };

        const response = await WooCommerce.post("products", data);
        console.log(response.data);

        return {
            msg: 'Successfully created.',
            data: response.data
        };
    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to create product');
    }
};

module.exports.addProductVariant = async (requestBody) => {
    try {
        const {
            regular_price,
            attributes,
            image,
            product_id,
        } = requestBody;

        const data = {
            regular_price: regular_price,
            image: image,
            attributes: attributes
        };

        const response = await WooCommerce.post(`products/${product_id}/variations`, data);
        console.log(response.data);

        return {
            msg: 'Successfully add variations',
            data: response.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to create product');
    }
};

module.exports.getProduct = async (requestBody) => {
    try {
        const {
            product_id
        } = requestBody;

        const response = await WooCommerce.get(`products`);
        console.log(response.data);

        return {
            msg: 'Successfully get product',
            data: response.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product');
    }
};

module.exports.addProductUsingOrderwise = async (requestBody) => {
    try {
        const { product_id } = requestBody;


        const variantsResponse = await axios.get(`http://31.216.7.186/OWAPI/products/${product_id}/variants`, {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
            }
        });

        const variants = variantsResponse.data;
        if (variants.length === 0) {
            return {
                msg: 'No variants found for this product',
            };
        }

        const variantID = variants[0].variantID
        const variantsFullDetailsResponse = await axios.get(`http://31.216.7.186/OWAPI/variants/${variantID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!variantsFullDetailsResponse.data) {
            return {
                msg: 'No variants found for this product',
            };
        }

        const variantsStockDetailsResponse = await axios.get(`http://31.216.7.186/OWAPI/stock/${variantID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("data", variantsStockDetailsResponse.data)
        let variantDetailsStockData = null
        if (variantsStockDetailsResponse.data.length > 1) {
            let stock = null
            for (let i = 0; i < variantsStockDetailsResponse.data.length; i++) {
                stock += variantsStockDetailsResponse.data[i].freeStock
            }
            variantDetailsStockData = stock
        }

        if (variantsStockDetailsResponse.length === 1) {
            variantDetailsStockData = variantsStockDetailsResponse.data[0].freeStock
        }

        console.log("stock", variantDetailsStockData)
        const variantDetailsInfoData = variantsFullDetailsResponse.data[0].variantInfo
        const variantDetailsPurchaseData = variantsFullDetailsResponse.data[0].variantPurchaseSettings

        const returnData = {
            name: variantDetailsInfoData.description,
            type: "simple",
            regular_price: String(variantDetailsPurchaseData.estimatedCost),
            description: variantDetailsInfoData.description,
            short_description: variantDetailsInfoData.description,
            categories: [
                {
                    "id": 68
                }
            ],
            stock_status: "instock",
            manage_stock: true,
            stock_quantity: variantDetailsStockData
        }
        console.log("Return data", returnData)
        // const WooCommerceResponse = await WooCommerce.post("products", returnData);
        // console.log(WooCommerceResponse.data);

        return {
            msg: 'Successfully created.',
            data: returnData
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to add product variants');
    }
};

module.exports.getAllProductUsingOrderwise = async (requestBody) => {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];


        const mainAtrributeresponse = await WooCommerce.get("products/attributes")

        const categoryResponse = await fetchCategoriesWithParentNames();

        const optionDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/69`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        })

        const categoryDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/57`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        })


        const mismatchData = await findMismatchedAttributes(mainAtrributeresponse.data, optionDetails.data)
        const misMatchCateData = await findMismatchedCategories(categoryResponse, categoryDetails.data)

        if (mismatchData && mismatchData.length != 0) {
            mismatchData.forEach(async mismatchData => {
                let description = mismatchData.po_description.length > 26
                    ? mismatchData.po_description.split(' ').map(word => word[0]).join('')
                    : mismatchData.po_description;

                const newAttribute = {
                    name: description,
                    slug: `ow_${description}`,
                    type: "select",
                    order_by: "menu_order"
                };

                let optionsArray = [];

                if (mismatchData.options) {
                    try {
                        optionsArray = JSON.parse(mismatchData.options);  // Parse the JSON string
                    } catch (error) {
                        console.error("Failed to parse options:", error);
                    }
                }

                // Now you can map over the parsed options array
                const optionArrayWithImg = optionsArray.map(option => ({
                    name: option.name || "",
                    image: option.image ? option.image.split('\\').pop() : ""  // Handle image path correctly
                }));

                console.log("option array: ", optionArrayWithImg);
                try {
                    let responseAttribute = await WooCommerce.post("products/attributes", newAttribute)

                    if (responseAttribute.data && optionArrayWithImg) {
                        await addingAttributesTermsWithDescription(optionArrayWithImg, responseAttribute.data.id)
                    }
                } catch (error) {
                    console.log("error attribute:", error)
                    throw new BadRequestException('Failed to create Attribute');
                }
            });
        }

        if (misMatchCateData && misMatchCateData.length !== 0) {
            for (const mismatchData of misMatchCateData) {
                let parentid = null;

                const cateResponse = await fetchCategoriesWithParentNames();

                if (!Array.isArray(cateResponse)) {
                    console.error('cateResponse is not an array', cateResponse);
                    throw new BadRequestException('Failed to fetch categories');
                }

                const newAttribute = {
                    name: mismatchData.ctn_description,
                    slug: `ow_${mismatchData.ctn_description}`,
                };

                if (mismatchData.parent_description) {
                    const matchedCategory = await categoryDetails.data.find(category => {
                        return mismatchData.ctn_parent_id === category.ctn_id;
                    });


                    // Ensure matchedCategory is found before using it
                    if (matchedCategory) {
                        console.log("matched obj:", matchedCategory)
                        parentid = await findParentWithObjCategory(cateResponse, matchedCategory);

                        if (parentid) {
                            let description = mismatchData.parent_description.split(' ').map(word => word[0]).join('')
                            newAttribute.parent = parentid; // Set the parent ID if found
                            newAttribute.slug = `ow_${mismatchData.ctn_description}_${description}`
                        }
                    } else {
                        console.log(`No matched category found for parent ID: ${mismatchData.ctn_parent_id}`);
                    }
                }

                try {
                    await WooCommerce.post("products/categories", newAttribute)
                    await delay(1000);  // Add delay between category creation
                } catch (error) {
                    console.error(`Failed to create category: ${newAttribute.name}`, error);
                    throw new BadRequestException('Failed to create categories');
                }
            }
        }

        const orderwiseProductDetails = await getProductsWithVariantsOw();

        const woocommerceProductsDetails = await getProductsFromWoocommerce();

        const productDetails = await compareMismatchedProducts(orderwiseProductDetails, woocommerceProductsDetails);

        if (productDetails && productDetails.length > 0) {

            const cateResponse = await fetchCategoriesWithParentNames();

            for (const singleProduct of productDetails) {

                let parentProductData = {
                    name: null,
                    type: "variable",
                    status: "publish",
                    description: null,
                    short_description: null,
                    categories: null,
                    images: [],
                    attributes: null,
                    stock_status: "instock",
                    meta_data: null
                }

                let mainProduct = singleProduct.mainProduct
                let mainProImgArray = [];
                let metaData = [
                    {
                        key: 'ow_sku',
                        value: mainProduct.pd_product_code
                    }

                ];
                if (mainProduct.vwsi_filepath) {

                    const mainProductImgName = mainProduct.vwsi_filepath ? mainProduct.vwsi_filepath.split("\\").pop() : null;

                    const mainProductImgUrl = mainProductImgName ? `https://glenappin.com/images/product/l/${mainProductImgName}` : null;

                    if (mainProductImgName) {
                        let mainProductImageData = {
                            src: String(mainProductImgUrl),
                            name: String(mainProductImgName)
                        }
                        mainProImgArray.push(mainProductImageData)
                    }
                }

                parentProductData.images = mainProImgArray;
                parentProductData.name = mainProduct.pd_description;
                parentProductData.description = mainProduct.pd_description;
                parentProductData.meta_data = metaData;

                let categoryIdsArray = mainProduct.category_ids.split(',').map(id => id.trim());
                console.log("cat array:", categoryIdsArray)
                let mainProCategoryArray = [];

                await Promise.all(
                    categoryIdsArray.map(async categoryId => {
                        const matchedCategory = await categoryDetails.data.find(category => {
                            return Number(categoryId) === Number(category.ctn_id);
                        });

                        if (matchedCategory) {
                            let catData = {
                                "id": await findCategoryWithObj(cateResponse, matchedCategory)
                            };
                            mainProCategoryArray.push(catData);
                        }
                    })
                );
                parentProductData.categories = mainProCategoryArray;

                const Attributedescriptions = [
                    mainProduct.pd_option_1_description,
                    mainProduct.pd_option_2_description,
                    mainProduct.pd_option_3_description,
                    mainProduct.pd_option_4_description
                ].filter(description => description !== null);

                console.log(Attributedescriptions);

                const attributeArray = []
                let attributePosition = 0;
                for (const attribute of Attributedescriptions) {
                    let oprtionArray = []
                    let atrributeData = await finddAttributesWithObj(mainAtrributeresponse.data, attribute)
                    try {
                        let option1Values = await getOptionValuesByName(singleProduct.variants, `option_name_${attributePosition + 1}`);
                        oprtionArray = option1Values;
                    }
                    catch (error) {
                        console.log("error", error)
                        throw new BadRequestException('Failed to get terms');
                    }

                    let data = {
                        "id": atrributeData.id,
                        "name": atrributeData.name,
                        "visible": true,
                        "variation": true,
                        "options": oprtionArray,
                        "position": attributePosition
                    }

                    attributeArray.push(data);
                    attributePosition++
                }

                parentProductData.attributes = attributeArray;

                let newCreatedProduct = null;

                try {
                    newCreatedProduct = await WooCommerce.post("products", parentProductData);
                    console.log(newCreatedProduct.data);
                } catch (error) {
                    console.error(error);
                    throw new BadRequestException('Failed to add product into Woocommerce');
                }

                if (newCreatedProduct.data.id) {
                    const productId = newCreatedProduct.data.id;

                    try {
                        let data = {
                            sku: `ow_${mainProduct.pd_id}_${newCreatedProduct.data.id}`
                        }

                        await delay(1000);

                        const updateProductSku = await WooCommerce.put(`products/${newCreatedProduct.data.id}`, data);

                        console.log(updateProductSku.data);
                    } catch (error) {
                        console.error(error);
                        await WooCommerce.delete(`products/${productId}`, { force: true });
                        throw new BadRequestException('Failed to update product');
                    }

                    for (const variantProduct of singleProduct.variants) {
                        let attributeResponseArray = [];
                        let requestdata = null
                        requestdata = {
                            regular_price: String(variantProduct.vafp_rsp_exc_vat),
                            attributes: null,
                            stock_quantity: Number(variantProduct.vasq_free_stock_quantity),
                            description: String(variantProduct.vad_description),
                            image: null,
                            manage_stock: true,
                            meta_data: null
                        };

                        requestdata.meta_data = [
                            {
                                key: 'variant_ow_sku',
                                value: variantProduct.vad_variant_code
                            }

                        ];

                        if (variantProduct.vwsi_filepath) {
                            // Step 3: Set image data if available
                            const image_name = variantProduct?.vwsi_filepath ? variantProduct.vwsi_filepath.split("\\").pop() : null;

                            const imageUrl = image_name ? `https://glenappin.com/images/product/l/${image_name}` : null;

                            if (image_name) {
                                requestdata.image = { src: imageUrl, name: image_name };
                            } else {
                                requestdata.image = null;
                            }

                        }

                        const optionNames = [
                            variantProduct.option_name_1,
                            variantProduct.option_name_2,
                            variantProduct.option_name_3,
                            variantProduct.option_name_4
                        ].filter(option => option !== null);


                        if (optionNames.length == attributeArray.length) {
                            for (let i = 0; i < optionNames.length; i++) {
                                let data = {
                                    id: Number(attributeArray[i].id),
                                    name: String(attributeArray[i].name),
                                    option: String(optionNames[i])
                                }
                                attributeResponseArray.push(data)
                            }
                        }
                        console.log("option array lengths:", attributeResponseArray.length);
                        requestdata.attributes = attributeResponseArray;

                        await delay(1000);

                        try {
                            const newCreatedVariations = await WooCommerce.post(`products/${productId}/variations`, requestdata);

                            // Retrieve the newly created variation's ID
                            const variationId = newCreatedVariations.data.id; // Assuming 'data.id' contains the new variation's ID

                            if (variationId) {
                                // Construct SKU data only if variationId exists
                                const skuData = {
                                    sku: `ow_${variantProduct.vad_id}_${variationId}`
                                };

                                // Optional delay, if required for WooCommerce API rate limiting
                                await delay(1000);

                                try {
                                    // Update the SKU for the newly created variation
                                    await WooCommerce.put(`products/${productId}/variations/${variationId}`, skuData);
                                } catch (error) {
                                    // Error handling: delete the entire product if SKU update fails
                                    await WooCommerce.delete(`products/${productId}`, { force: true });
                                    console.log("error", error);
                                    throw new BadRequestException('Failed to update product variant into WooCommerce');
                                }
                            }
                        } catch (error) {
                            // Error handling: delete the entire product if variation creation fails
                            await WooCommerce.delete(`products/${productId}`, { force: true });
                            console.log("error", error);
                            console.log("error product ID:", productId)
                            throw new BadRequestException('Failed to add product variant into WooCommerce');
                        }

                    }
                }

            }

        }

        const orderwiseSimpleProductDetails = await getSimpleProductOWNew();

        const woocommerceSecondProductsDetails = await getProductsFromWoocommerce();

        const simpleProductDetails = await compareMismatchedSimpleProducts(orderwiseSimpleProductDetails, woocommerceSecondProductsDetails);

        if (simpleProductDetails && simpleProductDetails.length > 0) {
            const cateResponse = await fetchCategoriesWithParentNames();
            for (const singleProduct of simpleProductDetails) {
                let parentProductData = {
                    name: null,
                    type: "simple",
                    status: "publish",
                    description: null,
                    short_description: null,
                    categories: null,
                    images: [],
                    stock_status: "instock",
                    stock_quantity: null,
                    regular_price: null,
                    manage_stock: true,
                    meta_data: null
                }
                let mainProduct = singleProduct
                let mainProImgArray = [];

                parentProductData.meta_data = [
                    {
                        key: 'ow_sku',
                        value: mainProduct.pd_product_code
                    }
                ];

                if (mainProduct.vwsi_filepath) {

                    const mainProductImgName = mainProduct.vwsi_filepath ? mainProduct.vwsi_filepath.split("\\").pop() : null;

                    const mainProductImgUrl = mainProductImgName ? `https://glenappin.com/images/product/l/${mainProductImgName}` : null;

                    if (mainProductImgName) {
                        let mainProductImageData = {
                            src: String(mainProductImgUrl),
                            name: String(mainProductImgName)
                        }
                        mainProImgArray.push(mainProductImageData)
                    }
                }
                parentProductData.images = mainProImgArray;
                parentProductData.name = mainProduct.pd_description;
                parentProductData.description = mainProduct.pd_description;

                let categoryIdsArray = mainProduct.category_ids.split(',').map(id => id.trim());
                console.log("cat array:", categoryIdsArray)
                let mainProCategoryArray = [];

                await Promise.all(
                    categoryIdsArray.map(async categoryId => {
                        const matchedCategory = await categoryDetails.data.find(category => {
                            return Number(categoryId) === Number(category.ctn_id);
                        });

                        if (matchedCategory) {
                            let catData = {
                                "id": await findCategoryWithObj(cateResponse, matchedCategory)
                            };
                            mainProCategoryArray.push(catData);
                        }
                    })
                );
                parentProductData.categories = mainProCategoryArray;
                parentProductData.stock_quantity = Number(mainProduct.vasq_overall_stock_quantity);
                parentProductData.regular_price = String(mainProduct.vafp_rsp_exc_vat);

                let newCreatedProduct = null;

                try {
                    newCreatedProduct = await WooCommerce.post("products", parentProductData);
                    console.log(newCreatedProduct.data);
                } catch (error) {
                    console.error(error);
                }
                if (newCreatedProduct.data.id) {

                    try {
                        let data = {
                            sku: `ow_${mainProduct.pd_id}_${newCreatedProduct.data.id}`
                        }
                        const updateProductSku = await WooCommerce.put(`products/${newCreatedProduct.data.id}`, data);
                        console.log(updateProductSku.data);
                    } catch (error) {
                        console.error(error);
                    }
                }

            }
        }

        const productsAndVariantsFromWoocommerce = await getProductsAndVariantsWithVariableSkuWoocommerce();

        const orderwiseSecondProductDetails = await getProductsWithVariantsOw();

        if (orderwiseSecondProductDetails && orderwiseSecondProductDetails.length > 0) {
            // Filter orderwise products to match WooCommerce SKU criteria
            const matchingOrderwiseProducts = orderwiseSecondProductDetails.filter(orderProduct => {
                const orderPdId = orderProduct.mainProduct.pd_id;

                // Check if any WooCommerce product matches the orderwise product by extracting the first number after "ow_"
                return productsAndVariantsFromWoocommerce.some(wooProductData => {
                    const wooSku = wooProductData.mainProduct.sku;

                    // Extract the first number after "ow_" in the WooCommerce SKU
                    const skuNumberMatch = wooSku.match(/^ow_(\d+)/);
                    const wooSkuNumber = skuNumberMatch ? parseInt(skuNumberMatch[1], 10) : null;

                    // Return true if the Woo SKU number matches the order pd_id
                    return wooSkuNumber === orderPdId;
                });
            });

            for (const orderProduct of matchingOrderwiseProducts) {
                const orderPdId = orderProduct.mainProduct.pd_id;
                console.log()
                // Find the corresponding WooCommerce product based on SKU
                const wooProductData = productsAndVariantsFromWoocommerce.find(wooProduct => {
                    const wooSku = wooProduct.mainProduct.sku;
                    const skuNumberMatch = wooSku.match(/^ow_(\d+)/);
                    const wooSkuNumber = skuNumberMatch ? parseInt(skuNumberMatch[1], 10) : null;
                    return wooSkuNumber === orderPdId;
                });

                if (wooProductData) {
                    // Compare each variant in the WooCommerce product with the orderwise variants
                    for (const orderVariant of orderProduct.variants) {
                        // Ensure SKU format for WooCommerce variant matches orderwise variant SKU
                        const matchingWooVariant = wooProductData.variants.find(wooVariant => {
                            // Extract the first number after "ow_" in the WooCommerce variant SKU
                            const variantSkuMatch = wooVariant.sku.match(/^ow_(\d+)/);
                            const wooVariantSkuNumber = variantSkuMatch ? parseInt(variantSkuMatch[1], 10) : null;

                            // Check if this variant matches by SKU format and ID
                            return orderVariant.vad_id === wooVariantSkuNumber
                        });

                        if (matchingWooVariant) {
                            const updates = {};

                            // Check for stock change, converting both values to numbers for comparison
                            if (Number(matchingWooVariant.stock_quantity) !== Number(orderVariant.vasq_free_stock_quantity)) {
                                updates.stock_quantity = Number(orderVariant.vasq_free_stock_quantity); // Convert to number for WooCommerce update
                            }

                            // Check for price change, converting both values to numbers for comparison
                            if (Number(matchingWooVariant.price) !== Number(orderVariant.vafp_rsp_exc_vat)) {
                                updates.price = String(orderVariant.vafp_rsp_exc_vat); // Convert to number for WooCommerce update
                            }


                            // Update WooCommerce if there are changes
                            if (Object.keys(updates).length > 0) {
                                try {
                                    await fetchWithRetry(`products/${wooProductData.mainProduct.id}/variations/${matchingWooVariant.id}`, {
                                        method: 'PUT',
                                        data: updates
                                    });
                                    console.log(`Updated variant ID ${matchingWooVariant.id} for product ID ${wooProductData.mainProduct.id}:`, updates);
                                } catch (updateError) {
                                    console.error(`Error updating variant ID ${matchingWooVariant.id} for product ID ${wooProductData.mainProduct.id}:`, updateError.response ? updateError.response.data : updateError.message);
                                }
                            }
                        }
                    }
                }

            }
        }

        const simpleProductsFromWoocommerce = await getProductsWithSimpleSkuWoocommerce();

        const orderwiseSecondSimpleProductDetails = await getSimpleProductOWNew();

        if (orderwiseSecondSimpleProductDetails && orderwiseSecondSimpleProductDetails.length > 0) {
            // Filter orderwise products to match WooCommerce SKU criteria
            const matchingOrderwiseSimpleProducts = orderwiseSecondSimpleProductDetails.filter(orderProduct => {
                const orderPdId = orderProduct.pd_id;

                // Check if any WooCommerce product matches the orderwise product by extracting the first number after "ow_"
                return simpleProductsFromWoocommerce.some(wooProductData => {
                    const wooSku = wooProductData.sku;

                    // Extract the first number after "ow_" in the WooCommerce SKU
                    const skuNumberMatch = wooSku.match(/^ow_(\d+)/);
                    const wooSkuNumber = skuNumberMatch ? parseInt(skuNumberMatch[1], 10) : null;

                    // Return true if the Woo SKU number matches the order pd_id
                    return wooSkuNumber === orderPdId;
                });
            });

            for (const orderProduct of matchingOrderwiseSimpleProducts) {
                const orderPdId = orderProduct.pd_id;

                // Find the corresponding WooCommerce product based on SKU
                const wooProductData = simpleProductsFromWoocommerce.find(wooProduct => {
                    const wooSku = wooProduct.sku;
                    const skuNumberMatch = wooSku.match(/^ow_(\d+)/);
                    const wooSkuNumber = skuNumberMatch ? parseInt(skuNumberMatch[1], 10) : null;
                    return wooSkuNumber === orderPdId;
                });

                if (wooProductData && wooProductData.type === "simple") { // Ensure this is a simple product
                    const updates = {};

                    // Check for stock change, converting both values to numbers for comparison
                    if (Number(wooProductData.stock_quantity) !== Number(orderProduct.vasq_free_stock_quantity)) {
                        updates.stock_quantity = Number(orderProduct.vasq_free_stock_quantity);
                    }

                    // Check for price change, converting both values to numbers for comparison
                    if (Number(wooProductData.price) !== Number(orderProduct.vafp_rsp_exc_vat)) {
                        updates.price = String(orderProduct.vafp_rsp_exc_vat);
                    }

                    // Update WooCommerce if there are changes
                    if (Object.keys(updates).length > 0) {
                        try {
                            await fetchWithRetry(`products/${wooProductData.id}`, {
                                method: 'PUT',
                                data: updates
                            });
                            console.log(`Updated simple product ID ${wooProductData.id}:`, updates);
                        } catch (updateError) {
                            console.error(`Error updating simple product ID ${wooProductData.id}:`, updateError.response ? updateError.response.data : updateError.message);
                        }
                    }
                }
            }
        }


        return {
            msg: 'Successfully the session',
        };


    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to add product variants');
    }
};

async function getOptionValuesByName(variants, optionKey) {
    return variants
        .map(variant => variant[optionKey])
        .filter(option => option !== null);
};

async function finddAttributesWithObj(wooCommerceAttributes, attributeName) {

    // Check if wooCommerceAttributes and optionDetails are arrays
    if (!Array.isArray(wooCommerceAttributes)) {
        throw new BadRequestException("Either wooCommerceAttributes or optionDetails is not an array");
    }


    let prodDescription = attributeName.trim().toLowerCase();
    if (prodDescription.length > 26) {
        prodDescription = prodDescription.split(' ').map(word => word[0]).join('');
    }

    // Find matching attribute in WooCommerce attributes
    const matchedAttribute = wooCommerceAttributes.find(attr => {
        const attrName = attr.name.trim().toLowerCase();
        return attrName.includes(prodDescription);
    });

    if (matchedAttribute) {
        return matchedAttribute
    }

}

async function findMismatchedAttributes(wooCommerceAttributes, optionDetails) {
    const mismatches = [];
    let attMisCount = 0;

    // Check if wooCommerceAttributes and optionDetails are arrays
    if (!Array.isArray(wooCommerceAttributes) || !Array.isArray(optionDetails)) {
        throw new BadRequestException("Either wooCommerceAttributes or optionDetails is not an array");
    }

    // Loop through the optionDetails and compare with WooCommerce attributes
    optionDetails.forEach(prod => {
        // Handle prod.po_description length more than 26
        let prodDescription = prod.po_description.trim().toLowerCase();
        if (prodDescription.length > 26) {
            prodDescription = prodDescription.split(' ').map(word => word[0]).join('');
        }

        // Find matching attribute in WooCommerce attributes
        const matchedAttribute = wooCommerceAttributes.find(attr => {
            const attrName = attr.name.trim().toLowerCase();
            return attrName.includes(prodDescription);
        });

        if (!matchedAttribute) {
            attMisCount++;
            mismatches.push(prod);
        }
    });

    console.log("Mismatch attributes count: ", attMisCount);
    return mismatches;
}

async function addingAttributesTermsWithDescription(options, attributeId) {
    for (const option of options) {

        let data = {
            name: option.name,
            description: option.image ? `https://glenappin.com/images/option_value/source/${option.image}` : ""
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

async function findMismatchedCategories(wooCommerceCategories, categoriesDetails) {
    const mismatches = [];
    let matchesCount = 0;

    // Check if both inputs are arrays
    if (!Array.isArray(wooCommerceCategories) || !Array.isArray(categoriesDetails)) {
        throw new BadRequestException("Either wooCommerceCategories or categoriesDetails is not an array");
    }

    for (const prod of categoriesDetails) {
        console.log(`\n=== Checking Product: ${prod.ctn_description} ===`);
        const prodDescription = normalizeString(prod.ctn_description);

        const matchedCategory = wooCommerceCategories.find(category => {
            const categoryName = normalizeString(category.name);

            // Check if the category name matches the product description
            const categoryMatches = categoryName.includes(prodDescription);

            // If category name doesn't match, return false immediately
            if (!categoryMatches) return false;

            // Check if parent name exists on both product and category and match them
            if (category.parent_name && prod.parent_description) {
                console.log("Matching parent name for category ID: ", category.id);

                const categoryParentName = normalizeString(category.parent_name);
                const prodParentDescription = normalizeString(prod.parent_description);

                // Check if parent names match
                const categoryParentMatches = categoryParentName.includes(prodParentDescription);

                if (!categoryParentMatches) {
                    return false;  // Parent name doesn't match
                }
            } else if (category.parent_name || prod.parent_description) {
                // If one has a parent name and the other doesn't, it's a mismatch
                return false;
            }

            return true;  // All conditions match
        });

        if (matchedCategory) {
            matchesCount++;
        } else {
            // If no matching category is found, add the product to mismatches
            mismatches.push(prod);
        }
    }

    console.log("Total matches found:", matchesCount);
    return mismatches;  // Return the list of mismatched categories
}

async function findParentWithObjCategory(wooCommerceCategories, parentCategory) {

    // Check if wooCommerceCategories is an array
    if (Array.isArray(wooCommerceCategories)) {
        for (const category of wooCommerceCategories) {
            const catName = normalizeString(category.name);
            const parentName = normalizeString(parentCategory.ctn_description);

            console.log("Matching names parent: ", catName);
            if (catName.includes(parentName)) {
                // Check if the matched category has a parent name
                if (category.parent_name && parentCategory.parent_description) {
                    const categoryParentName = normalizeString(category.parent_name);
                    const prodParentDescription = normalizeString(parentCategory.parent_description);

                    // Check if parent name matches
                    const categoryParentMatches = categoryParentName.includes(prodParentDescription);
                    if (categoryParentMatches) {
                        console.log("Matched: ", category.id);
                        return category.id; // Return the first matched category ID
                    }
                } else {
                    return category.id;
                }
            }
        }

        console.log(`No matches found for: ${parentCategory.ctn_description}`);
    } else {
        throw new BadRequestException("wooCommerceCategories is not an array");
    }

    return null; // Return null if no match is found
}

async function findCategoryWithObj(wooCommerceCategories, parentCategory) {
    if (!Array.isArray(wooCommerceCategories)) {
        throw new BadRequestException("wooCommerceCategories is not an array");
    }
    console.log("cat:", parentCategory)
    // Array to store possible matches
    const catArray = [];

    const parentName = normalizeString(parentCategory.ctn_description);

    for (const category of wooCommerceCategories) {
        const catName = normalizeString(category.name);
        if (catName === parentName) {

            // If no parent description exists in the parentCategory, return the current category id
            if (!parentCategory.parent_description && !category.parent_name) {
                console.log("Found Cat", category)
                return category.id;
            }
            else {
                catArray.push(category);
            }
        }
    }

    console.log("parent cat: ", catArray)
    // Check in the matched categories for parent match
    // if (catArray.length > 0) {
    //     for (const category of catArray) {
    //         const catParentName = normalizeString(category.parent_name);
    //         const parentDescription = normalizeString(parentCategory.parent_description);

    //         if (catParentName.includes(parentDescription)) {
    //             return category.id;
    //         }
    //     }
    // }
    if (catArray.length > 0) {
        for (const category of catArray) {
            const catParentName = category.parent_name ? normalizeString(category.parent_name) : null;
            const parentDescription = normalizeString(parentCategory.parent_description);

            // Skip if parent_name is null or empty
            if (!catParentName) {
                continue; // Move to the next category
            }

            // Perform the includes() check only if parentDescription is not null
            if (parentDescription && catParentName.includes(parentDescription)) {
                return category.id;
            }
        }
    }

    console.log(`No matches found for: ${parentCategory.ctn_description}`);
    return null; // Return null if no match is found
}

const normalizeString = (str) => {
    const decodedString = he.decode(str); // Decode HTML entities like &amp;

    return decodedString
        .toLowerCase() // Convert to lowercase
        .trim()         // Remove leading and trailing spaces
        .replace(/&/g, 'and')  // Replace '&' with 'and'
        .replace(/[^a-z0-9]+/g, ''); // Remove all special characters except letters and numbers
};

async function fetchCategoriesWithParentNames() {
    const allCategories = [];
    let page = 1;
    let totalPages = 1;

    try {
        // Fetch the categories page by page
        while (page <= totalPages) {
            const categoryResponse = await fetchWithRetry("products/categories", {
                per_page: 100,  // Fetch 100 categories per page (WooCommerce limit)
                page: page      // Set current page
            });

            const categories = categoryResponse.data;
            totalPages = parseInt(categoryResponse.headers['x-wp-totalpages'], 10);  // Get total pages from headers

            // Fetch parent category names if needed
            for (const category of categories) {
                if (category.parent !== 0) {
                    const parentResponse = await fetchWithRetry(`products/categories/${category.parent}`);
                    category.parent_name = parentResponse.data.name;  // Attach parent category name
                } else {
                    category.parent_name = null;  // No parent, top-level category
                }
            }

            // Append current page categories to allCategories
            allCategories.push(...categories);

            // Move to the next page
            page++;
        }

        console.log("category count: ", allCategories.length);
        return allCategories;
    } catch (error) {
        console.error("Error fetching categories with parent names:", error.response ? error.response.data : error.message);
    }
}

async function getProductsFromWoocommerce() {
    try {
        const allProducts = [];
        const perPage = 100;
        let page = 1;

        // Initial request to get total pages and the first set of products
        const initialResponse = await fetchWithRetry("products", {
            per_page: perPage,
            page: page
        });

        const totalPages = parseInt(initialResponse.headers['x-wp-totalpages'], 10);
        allProducts.push(...initialResponse.data);

        // Create an array of page numbers to fetch in parallel
        const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

        // Fetch remaining pages in parallel with retry logic
        const requests = pageNumbers.map(pageNum =>
            fetchWithRetry("products", { per_page: perPage, page: pageNum })
        );

        // Await all responses and gather product data
        const responses = await Promise.all(requests);
        responses.forEach(response => allProducts.push(...response.data));

        console.log("Total products fetched:", allProducts.length);
        return allProducts;

    } catch (error) {
        if (error.response && error.response.data) {
            console.error("API Response Error:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
        throw new Error('Failed to retrieve products');
    }
}

async function getProductsAndVariantsFromWoocommerce() {
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

            try {
                // If the product is a variable product, fetch its variants
                if (String(product.type) === 'variable') {

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

        return productsWithVariants;

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

async function getProductsWithVariantsOw() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/75`, data, {
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
        // const first10UniqueProducts = Array.from(productMap.values()).slice(0, 100);

        return Array.from(productMap.values())

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
}

async function compareMismatchedProducts(orderwiseProducts, woocommerceProducts) {
    try {

        if (!orderwiseProducts) {
            return null;
        }
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

async function compareMismatchedSimpleProducts(orderwiseProducts, woocommerceProducts) {
    try {

        if (!orderwiseProducts) {
            return null;
        }

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

async function getSimpleProductOWNew() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/76`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        // const firstTenProducts = productDetails.data.slice(0, 50);

        return productDetails.data


    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
};

async function getProductsAndVariantsWithVariableSkuWoocommerce() {
    // Retrieve products and variants from WooCommerce
    const productsAndVariantsFromWoocommerce = await getProductsAndVariantsFromWoocommerce();

    // Filter to get only products that are of type "variable" and have an SKU containing "ow" in mainProduct
    const productsWithSkuContainingOw = productsAndVariantsFromWoocommerce
        .filter(productData =>
            productData.mainProduct &&
            productData.mainProduct.sku &&
            productData.mainProduct.sku.includes("ow") &&
            productData.mainProduct.type === "variable"
        )
        .map(productData => ({
            mainProduct: productData.mainProduct,
            variants: productData.variants
        }));

    return productsWithSkuContainingOw;
}

async function getProductsWithSimpleSkuWoocommerce() {
    // Retrieve products and variants from WooCommerce
    const productsFromWoocommerce = await getProductsFromWoocommerce();

    // Filter to get only products that are of type "variable" and have an SKU containing "ow"
    const productsWithSkuContainingOw = productsFromWoocommerce
        .filter(productData =>
            productData &&
            productData.sku &&
            productData.sku.includes("ow") &&
            productData.type === "simple"
        );

    return productsWithSkuContainingOw;
}

