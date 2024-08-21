const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed

module.exports.addAttribute = async (requestBody) => {
    try {
        const {
            name,
            slug,
            type,
            order_by,
            has_archives,
        } = requestBody;


        const data = {
            name: name,
            slug: slug,
            type: type,
            order_by: order_by,
            has_archives: has_archives
          };
          
          
        const response = await WooCommerce.post("products/attributes", data)
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

module.exports.getAttributes = async () => {
    try {

        const response = await WooCommerce.get("products/attributes")

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