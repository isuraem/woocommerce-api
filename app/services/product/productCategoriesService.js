const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed

module.exports.addCategory = async (requestBody) => {
    try {
        const {
            name,
            image
        } = requestBody;


        const data = {
            name: name,
            image: image,
        };

        const response = await WooCommerce.post("products/categories", data)
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


module.exports.getCategory = async (requestBody) => {
    try {
        const {
            category_id
        } = requestBody;

        console.log("category", category_id)
        const response = await WooCommerce.get(`products/categories/${category_id}`)

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

module.exports.getCategories = async () => {
    try {

        const response = await WooCommerce.get('products/categories')

        console.log(response.data);

        return {
            msg: 'Successfully get categories.',
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