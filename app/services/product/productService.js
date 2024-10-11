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


module.exports.statusProduct = async (requestBody) => {
    try {
        console.log("status", requestBody);

        return {
            msg: 'Status product',
            data: requestBody
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to status product');
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

// module.exports.addProductUsingOrderwise = async (requestBody) => {
//     try {
//         const {
//             product_id
//         } = requestBody;



//         return {
//             msg: 'Successfully Add product',
//         };

//     } catch (error) {
//         if (error.response && error.response.data) {
//             console.error(error.response.data);
//         } else {
//             console.error(error);
//         }
//         throw new BadRequestException('Failed to get product');
//     }
// };

module.exports.addProductUsingOrderwise = async (requestBody) => {
    try {
        const { product_id } = requestBody;


        const variantsResponse = await axios.get(`http://31.216.7.186/OWAPI/products/${product_id}/variants`, {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
            }
        });
        // console.log("data", variantsResponse.data)

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
        // // Add variants to WooCommerce
        // const wooCommerceResponse = await axios.post('https://your-woocommerce-site/wp-json/wc/v3/products/22/variations', variants, {
        //     headers: {
        //         'Authorization': 'Bearer your_woocommerce_auth_TOKEN', // Replace with actual WooCommerce auth TOKEN
        //         'Content-Type': 'application/json'
        //     }
        // });

        // // Assuming the response from WooCommerce will give some indication of success
        // if (wooCommerceResponse.status === 201) {
        //     return {
        //         msg: 'Successfully added product variants to WooCommerce',
        //     };
        // } else {
        //     throw new BadRequestException('Failed to add product variants to WooCommerce');
        // }

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


        const response = await WooCommerce.get("products/attributes")

        const categoryResponse = await fetchCategoriesWithParentNames();

        console.log("length", response.data.length)

        const optionDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/45`, data, {
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

        // const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/61`, data, {
        //     headers: {
        //         "Authorization": `Bearer ${process.env.TOKEN}`,
        //         "Content-Type": "application/json"
        //     }
        // })

        const mismatchData = await findMismatchedAttributes(response.data, optionDetails.data)
        const misMatchCateData = await findMismatchedCategories(categoryResponse, categoryDetails.data)

        console.log(categoryDetails.data.length)
        console.log("miss match categories length", misMatchCateData.length)

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


                const optionsArray = mismatchData.options.split(',').map(option => option.trim());

                try {
                    let responseAttribute = await WooCommerce.post("products/attributes", newAttribute)

                    if (responseAttribute.data && optionsArray) {
                        console.log("awa");
                        await addingAttributesTerms(optionsArray, responseAttribute.data.id)
                    }
                } catch (error) {
                    console.log("error attribute:", error)
                    throw new BadRequestException('Failed to create Attribute');
                }

            });
        }

        // if (misMatchCateData && misMatchCateData.length != 0) {
        //     misMatchCateData.forEach(async mismatchData => {
        //         await delay(1000);
        //         let parentid = null;
        //         const cateResponse = await fetchCategoriesWithParentNames();

        //         const newAttribute = {
        //             name: mismatchData.ctn_description,
        //             slug: `ow_${mismatchData.ctn_description}`,
        //         };

        //         if (mismatchData.parent_description) {
        //             parentid = await findParentCategory(cateResponse, mismatchData.parent_description)
        //             newAttribute.parent = parentid;
        //         }
        //         try {
        //             await WooCommerce.post("products/categories", newAttribute)
        //             await delay(1000);
        //         } catch (error) {
        //             console.error(error);
        //             throw new BadRequestException('Failed to create categories');
        //         }
        //     });
        // }
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
                        console.log(`Comparing: ${mismatchData.ctn_parent_id} to ${category.ctn_id}`);
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
                    console.log("category data: ", newAttribute)
                    await WooCommerce.post("products/categories", newAttribute)
                    console.log(`Successfully created category: ${newAttribute.name}`);
                    await delay(1000);  // Add delay between category creation
                } catch (error) {
                    console.error(`Failed to create category: ${newAttribute.name}`, error);
                    throw new BadRequestException('Failed to create categories');
                }
            }
        }
        const productDetails = await getTenProductsWithVariants()

        if (productDetails.length > 0) {

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
                }
                let mainProduct = singleProduct.mainProduct

                parentProductData.name = mainProduct.pd_description;
                parentProductData.description = mainProduct.pd_description;

                const matchedCategory = await categoryDetails.data.find(category => {
                    console.log(`Comparing: ${mainProduct.category_ids} to ${category.ctn_id}`);
                    return Number(mainProduct.category_ids) === Number(category.ctn_id);
                });

                if (matchedCategory) {
                    const catId = [
                        {
                            "id": await findCategoryWithObj(cateResponse, matchedCategory)
                        }
                    ]

                    parentProductData.categories = catId;

                }

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
                    let atrributeData = await finddAttributesWithObj(response.data, attribute)
                    try {
                        let termsArray = await WooCommerce.get(`products/attributes/${atrributeData.id}/terms`);
                        console.log("term array", termsArray.data)
                        if (termsArray.data.length > 0) {
                            termsArray.data.forEach(term => {
                                oprtionArray.push(term.name)
                            })
                        }
                    }
                    catch (error) {
                        console.log("error", error)
                    }

                    console.log("array", oprtionArray)
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
                    console.log("att data: ", atrributeData)
                }
                parentProductData.attributes = attributeArray
                // parentProductData.sku = `${productDummy.pd_id}_${productDummy.pd_product_code}_new`

                console.log("att data: ", attributeArray)
                console.log("data", parentProductData)

                let newCreatedProduct = null;

                try {
                    newCreatedProduct = await WooCommerce.post("products", parentProductData);
                    console.log(newCreatedProduct.data);
                } catch (error) {
                    console.error(error);
                }

                if (newCreatedProduct.data.id) {
                    const productId = newCreatedProduct.data.id;
    
                    for (const variantProduct of singleProduct.variants) {
                        let attributeResponseArray = []
                        let requestdata = {
                            regular_price: String(variantProduct.vafp_rsp_exc_vat),
                            attributes: null,
                            stock_quantity: Number(variantProduct.vasq_free_stock_quantity),
                            description: String(variantProduct.vad_description)
                        };
    
                        const optionNames = [
                            variantProduct.option_name_1,
                            variantProduct.option_name_2,
                            variantProduct.option_name_3,
                            variantProduct.option_name_4
                        ].filter(option => option !== null);
    
                        console.log(optionNames);
                        if (optionNames.length == attributeArray.length) {
                            for (let i = 0; i < optionNames.length; i++) {
                                let data = {
                                    id: Number(attributeArray[i].id),
                                    options: String(optionNames[i])
                                }
                                attributeResponseArray.push(data)
                            }
                        }
                        requestdata.attributes = attributeResponseArray
                        console.log("request data", productId)
                        await delay(1000);
                        try {
                            const response = await WooCommerce.post(`products/${productId}/variations`, requestdata);
                            console.log("data", response.data)
                        }
                        catch (error) {
                            console.log("error", error)
                        }
    
                    }
                }

            }



        }
        // if (productDetails.data) {

        //     const cateResponse = await fetchCategoriesWithParentNames();

        //     const productDetailsArray = productDetails.data
        //     // let parentProductData = {
        //     //     "name": null,
        //     //     "type": "variable",
        //     //     "status": "publish",
        //     //     "description": null,
        //     //     "short_description": null,
        //     //     "categories": null,
        //     //     "images": [],
        //     //     "attributes": null,
        //     //     "stock_status": "instock",
        //     //     "manage_stock": true,
        //     //     "sku": null,
        //     //     "stock_quantity": 50
        //     // }
        //     let parentProductData = {
        //         name: null,
        //         type: "variable",
        //         status: "publish",
        //         description: null,
        //         short_description: null,
        //         categories: null,
        //         images: [],
        //         attributes: null,
        //         stock_status: "instock",
        //     }
        //     let productDummy = productDetailsArray[0]

        //     parentProductData.name = productDummy.pd_description;
        //     parentProductData.description = productDummy.pd_description;

        //     const matchedCategory = await categoryDetails.data.find(category => {
        //         console.log(`Comparing: ${productDummy.category_ids} to ${category.ctn_id}`);
        //         return Number(productDummy.category_ids) === Number(category.ctn_id);
        //     });

        //     if (matchedCategory) {
        //         const catId = [
        //             {
        //                 "id": await findCategoryWithObj(cateResponse, matchedCategory)
        //             }
        //         ]

        //         parentProductData.categories = catId;

        //     }

        //     const Attributedescriptions = [
        //         productDummy.pd_option_1_description,
        //         productDummy.pd_option_2_description,
        //         productDummy.pd_option_3_description,
        //         productDummy.pd_option_4_description
        //     ].filter(description => description !== null);

        //     console.log(Attributedescriptions);


        //     const attributeArray = []
        //     let attributePosition = 0;
        //     for (const attribute of Attributedescriptions) {
        //         let oprtionArray = []
        //         let atrributeData = await finddAttributesWithObj(response.data, attribute)
        //         try {
        //             let termsArray = await WooCommerce.get(`products/attributes/${atrributeData.id}/terms`);
        //             console.log("term array", termsArray.data)
        //             if (termsArray.data.length > 0) {
        //                 termsArray.data.forEach(term => {
        //                     oprtionArray.push(term.name)
        //                 })
        //             }
        //         }
        //         catch (error) {
        //             console.log("error", error)
        //         }

        //         console.log("array", oprtionArray)
        //         let data = {
        //             "id": atrributeData.id,
        //             "name": atrributeData.name,
        //             "visible": true,
        //             "variation": true,
        //             "options": oprtionArray,
        //             "position": attributePosition
        //         }
        //         attributeArray.push(data);
        //         attributePosition++
        //         console.log("att data: ", atrributeData)
        //     }
        //     parentProductData.attributes = attributeArray
        //     // parentProductData.sku = `${productDummy.pd_id}_${productDummy.pd_product_code}_new`

        //     console.log("att data: ", attributeArray)
        //     console.log("data", parentProductData)

        //     let newCreatedProduct = null;

        //     try {
        //         newCreatedProduct = await WooCommerce.post("products", parentProductData);
        //         console.log(newCreatedProduct.data);
        //     } catch (error) {
        //         console.error(error);
        //     }

        //     if (newCreatedProduct.data.id) {
        //         const productId = newCreatedProduct.data.id;

        //         for (const variantProduct of productDetails.data) {
        //             let attributeResponseArray = []
        //             let requestdata = {
        //                 regular_price: String(variantProduct.vafp_rsp_exc_vat),
        //                 attributes: null,
        //                 stock_quantity: Number(variantProduct.vasq_free_stock_quantity),
        //                 description: String(variantProduct.vad_description)
        //             };

        //             const optionNames = [
        //                 variantProduct.option_name_1,
        //                 variantProduct.option_name_2,
        //                 variantProduct.option_name_3,
        //                 variantProduct.option_name_4
        //             ].filter(option => option !== null);

        //             console.log(optionNames);
        //             if (optionNames.length == attributeArray.length) {
        //                 for (let i = 0; i < optionNames.length; i++) {
        //                     let data = {
        //                         id: Number(attributeArray[i].id),
        //                         options: String(optionNames[i])
        //                     }
        //                     attributeResponseArray.push(data)
        //                 }
        //             }
        //             requestdata.attributes = attributeResponseArray
        //             console.log("request data", productId)
        //             await delay(1000);
        //             try {
        //                 const response = await WooCommerce.post(`products/${productId}/variations`, requestdata);
        //                 console.log("data", response.data)
        //             }
        //             catch (error) {
        //                 console.log("error", error)
        //             }

        //         }
        //     }


        // }
        // console.log("Product Data: ", productDetails.data)
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
        throw new BadRequestException('Failed to add product variants');
    }
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
        if (catName.includes(parentName)) {

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

    // Check in the matched categories for parent match
    if (catArray.length > 0) {
        for (const category of catArray) {
            const catParentName = normalizeString(category.parent_name);
            const parentDescription = normalizeString(parentCategory.parent_description);

            if (catParentName.includes(parentDescription)) {
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

async function getTenProductsWithVariants() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/64`, data, {
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
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 10);
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

module.exports.getManyProductInOrderwise = async () => {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/64`, data, {
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

module.exports.getOrderWoocommerce = async (requestBody) => {
    try {
       
        console.log("Data", requestBody)
        return {
            msg: 'Successfully get order details',
            data: requestBody
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